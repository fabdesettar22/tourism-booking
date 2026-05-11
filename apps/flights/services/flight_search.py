"""Flight search service: fetch from Duffel, apply commission, persist offers."""
from __future__ import annotations

import logging
import time
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from apps.flights.models import FlightRoute, FlightOffer, FlightSearchLog
from apps.flights.services import duffel_client

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 hours
CACHE_PREFIX = "flights:route"
TWO_PLACES = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _cache_key(route: FlightRoute) -> str:
    return f"{CACHE_PREFIX}:{route.id}"


def _parse_slice(slc: dict) -> dict:
    segments = slc.get("segments", [])
    first = segments[0] if segments else {}
    last = segments[-1] if segments else {}
    return {
        "origin": (slc.get("origin") or {}).get("iata_code"),
        "destination": (slc.get("destination") or {}).get("iata_code"),
        "departing_at": first.get("departing_at"),
        "arriving_at": last.get("arriving_at"),
        "duration": slc.get("duration"),
        "stops": max(0, len(segments) - 1),
        "segments": [
            {
                "marketing_carrier": (s.get("marketing_carrier") or {}).get("iata_code"),
                "flight_number": s.get("marketing_carrier_flight_number"),
                "origin": (s.get("origin") or {}).get("iata_code"),
                "destination": (s.get("destination") or {}).get("iata_code"),
                "departing_at": s.get("departing_at"),
                "arriving_at": s.get("arriving_at"),
                "duration": s.get("duration"),
                "aircraft": (s.get("aircraft") or {}).get("name"),
            }
            for s in segments
        ],
    }


def _parse_duration_minutes(iso: str | None) -> int:
    """Parse ISO-8601 duration like 'PT8H30M' to minutes. Best-effort."""
    if not iso or not iso.startswith("PT"):
        return 0
    hours = minutes = 0
    cur = ""
    for ch in iso[2:]:
        if ch.isdigit():
            cur += ch
        elif ch == "H":
            hours = int(cur or 0)
            cur = ""
        elif ch == "M":
            minutes = int(cur or 0)
            cur = ""
    return hours * 60 + minutes


def _build_offer_record(route: FlightRoute, raw: dict) -> dict[str, Any]:
    base = Decimal(str(raw.get("total_amount") or "0"))
    base_currency = raw.get("total_currency") or "USD"
    commission = _q(base * (route.commission_percentage / Decimal("100")))
    total = _q(base + commission)

    slices = [_parse_slice(s) for s in raw.get("slices", [])]
    total_minutes = sum(_parse_duration_minutes(s.get("duration")) for s in raw.get("slices", []))
    owner = raw.get("owner") or {}

    return {
        "provider_offer_id": raw.get("id", ""),
        "owner_iata": owner.get("iata_code") or "",
        "owner_name": owner.get("name") or "",
        "base_amount": _q(base),
        "base_currency": base_currency,
        "commission_amount": commission,
        "total_amount": total,
        "total_duration_min": total_minutes,
        "slices_summary": slices,
        "raw_payload": raw,
        "expires_at": raw.get("expires_at"),
    }


@transaction.atomic
def refresh_route_offers(route: FlightRoute, *, limit: int = 20) -> list[FlightOffer]:
    """Hit Duffel, replace offers for this route, return persisted records."""
    started = time.monotonic()
    try:
        offer_request = duffel_client.create_offer_request(
            origin=route.origin_iata,
            destination=route.destination_iata,
            departure_date=route.departure_date.isoformat(),
            return_date=route.return_date.isoformat() if route.return_date else None,
            adults=route.adults,
            children=route.children,
            cabin_class=route.cabin_class,
        )
        raw_offers = duffel_client.list_offers(offer_request["id"], limit=limit)
    except Exception as exc:
        FlightSearchLog.objects.create(
            route=route, status="FAIL",
            duration_ms=int((time.monotonic() - started) * 1000),
            error_message=str(exc)[:500],
        )
        raise

    route.offers.all().delete()
    new_offers = [FlightOffer(route=route, **_build_offer_record(route, o)) for o in raw_offers]
    FlightOffer.objects.bulk_create(new_offers)

    route.last_refreshed_at = timezone.now()
    route.save(update_fields=["last_refreshed_at", "updated_at"])

    cache.delete(_cache_key(route))

    FlightSearchLog.objects.create(
        route=route, status="SUCCESS",
        offers_count=len(new_offers),
        duration_ms=int((time.monotonic() - started) * 1000),
    )
    return list(route.offers.all())


def get_cached_offers(route: FlightRoute) -> list[FlightOffer]:
    """Return offers from DB (refresh if stale). Cache the ID list in Redis."""
    key = _cache_key(route)
    cached_ids = cache.get(key)
    if cached_ids:
        offers = list(FlightOffer.objects.filter(id__in=cached_ids, route=route).order_by("total_amount"))
        if offers:
            FlightSearchLog.objects.create(route=route, status="CACHE_HIT", offers_count=len(offers))
            return offers

    offers = list(route.offers.all().order_by("total_amount"))
    if offers:
        cache.set(key, [str(o.id) for o in offers], CACHE_TTL_SECONDS)
    return offers
