"""Live flight search — no offers persisted in DB; pricing is fetched per request."""
from __future__ import annotations

import hashlib
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from django.core.cache import cache

from apps.flights.models import FlightRoute
from apps.flights.services import duffel_client

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 30 * 60  # 30 minutes — quotes are volatile
TWO_PLACES = Decimal("0.01")


class RouteNotAvailable(Exception):
    pass


def _q(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _parse_duration_minutes(iso: str | None) -> int:
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


def _build_offer(raw: dict, commission_pct: Decimal) -> dict[str, Any]:
    base = Decimal(str(raw.get("total_amount") or "0"))
    currency = raw.get("total_currency") or "USD"
    commission = _q(base * (commission_pct / Decimal("100")))
    total = _q(base + commission)
    owner = raw.get("owner") or {}
    slices = [_parse_slice(s) for s in raw.get("slices", [])]
    duration = sum(_parse_duration_minutes(s.get("duration")) for s in raw.get("slices", []))

    return {
        "duffel_offer_id": raw.get("id", ""),
        "owner_iata": owner.get("iata_code") or "",
        "owner_name": owner.get("name") or "",
        "base_amount": str(_q(base)),
        "commission_amount": str(commission),
        "total_amount": str(total),
        "currency": currency,
        "duration_min": duration,
        "expires_at": raw.get("expires_at"),
        "slices": slices,
    }


def _cache_key(origin, destination, dep, ret, adults, children, infants, cabin) -> str:
    payload = f"{origin}|{destination}|{dep}|{ret or ''}|{adults}|{children}|{infants}|{cabin}"
    return "flights:search:" + hashlib.sha1(payload.encode()).hexdigest()


def _route_payload(route: FlightRoute) -> dict[str, Any]:
    return {
        "id": str(route.id),
        "origin": route.origin_iata,
        "destination": route.destination_iata,
        "commission_percentage": str(route.commission_percentage),
        "base_price": str(route.base_price) if route.base_price is not None else None,
        "commission_amount": str(route.commission_amount) if route.commission_amount is not None else None,
        "final_price": str(route.final_price) if route.final_price is not None else None,
        "display_title": route.display_title,
        "currency": route.currency,
        "pricing_source": "manual" if route.uses_manual_pricing else "live",
    }


def _search_manual(route: FlightRoute) -> dict[str, Any]:
    base = _q(route.base_price)
    commission = _q(route.commission_amount or Decimal("0"))
    total = _q(route.final_price or base)
    return {
        "route": _route_payload(route),
        "offers": [
            {
                "duffel_offer_id": "",
                "owner_iata": "",
                "owner_name": route.display_title or "Manual",
                "base_amount": str(base),
                "commission_amount": str(commission),
                "total_amount": str(total),
                "currency": route.currency,
                "duration_min": 0,
                "expires_at": None,
                "slices": [],
                "manual": True,
            }
        ],
    }


def search_live(
    *,
    origin: str,
    destination: str,
    departure_date,
    return_date=None,
    adults: int = 1,
    children: int = 0,
    infants: int = 0,
    cabin_class: str = "economy",
    limit: int = 20,
) -> dict:
    """Look up the active route, ask Duffel for live offers, apply commission, return JSON-ready dict.

    Raises RouteNotAvailable when no FlightRoute exists for (origin, destination, is_active=True).
    """
    origin = (origin or "").upper()
    destination = (destination or "").upper()

    try:
        route = FlightRoute.objects.get(
            origin_iata=origin,
            destination_iata=destination,
            is_active=True,
        )
    except FlightRoute.DoesNotExist:
        raise RouteNotAvailable(f"No active route for {origin} → {destination}")

    if route.uses_manual_pricing:
        key = _cache_key(origin, destination, "manual", None, adults, children, infants, cabin_class)
        cached = cache.get(key)
        if cached is not None:
            return cached
        result = _search_manual(route)
        cache.set(key, result, CACHE_TTL_SECONDS)
        return result

    dep_str = departure_date.isoformat() if hasattr(departure_date, "isoformat") else str(departure_date)
    ret_str = return_date.isoformat() if return_date and hasattr(return_date, "isoformat") else (return_date or None)

    key = _cache_key(origin, destination, dep_str, ret_str, adults, children, infants, cabin_class)
    cached = cache.get(key)
    if cached is not None:
        return cached

    offer_request = duffel_client.create_offer_request(
        origin=origin,
        destination=destination,
        departure_date=dep_str,
        return_date=ret_str,
        adults=adults,
        children=children,
        cabin_class=cabin_class,
    )
    raw_offers = duffel_client.list_offers(offer_request["id"], limit=limit)
    offers = [_build_offer(o, route.commission_percentage) for o in raw_offers]

    result = {
        "route": _route_payload(route),
        "offers": offers,
    }
    cache.set(key, result, CACHE_TTL_SECONDS)
    return result
