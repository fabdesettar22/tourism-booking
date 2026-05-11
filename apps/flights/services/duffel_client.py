"""Thin HTTP client for the Duffel Flights API.

Docs: https://duffel.com/docs/api/v2/overview
"""
from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

DUFFEL_VERSION = "v2"
TIMEOUT = 30


class DuffelError(Exception):
    def __init__(self, message: str, status: int | None = None, payload: Any = None):
        super().__init__(message)
        self.status = status
        self.payload = payload


def _headers() -> dict[str, str]:
    key = settings.DUFFEL_API_KEY
    if not key:
        raise DuffelError("DUFFEL_API_KEY is not configured")
    return {
        "Authorization": f"Bearer {key}",
        "Duffel-Version": DUFFEL_VERSION,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, *, json: dict | None = None, params: dict | None = None) -> dict:
    url = f"{settings.DUFFEL_BASE}{path}"
    try:
        resp = requests.request(method, url, headers=_headers(), json=json, params=params, timeout=TIMEOUT)
    except requests.RequestException as exc:
        raise DuffelError(f"Network error: {exc}") from exc

    if resp.status_code >= 400:
        try:
            body = resp.json()
        except ValueError:
            body = {"raw": resp.text[:500]}
        logger.warning("Duffel %s %s -> %s %s", method, path, resp.status_code, body)
        raise DuffelError(
            f"Duffel API {resp.status_code}", status=resp.status_code, payload=body
        )
    return resp.json()


def create_offer_request(
    *,
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None = None,
    adults: int = 1,
    children: int = 0,
    cabin_class: str = "economy",
) -> dict:
    """Create an offer request and return the response data block."""
    slices = [{"origin": origin, "destination": destination, "departure_date": departure_date}]
    if return_date:
        slices.append({"origin": destination, "destination": origin, "departure_date": return_date})

    passengers: list[dict] = [{"type": "adult"} for _ in range(max(1, adults))]
    passengers += [{"type": "child"} for _ in range(max(0, children))]

    payload = {"data": {"slices": slices, "passengers": passengers, "cabin_class": cabin_class}}
    data = _request("POST", "/air/offer_requests?return_offers=false", json=payload)
    return data.get("data", {})


def list_offers(offer_request_id: str, limit: int = 20, sort: str = "total_amount") -> list[dict]:
    """Return offers for an offer request, sorted by price ascending by default."""
    params = {
        "offer_request_id": offer_request_id,
        "limit": limit,
        "sort": sort,
    }
    data = _request("GET", "/air/offers", params=params)
    return data.get("data", [])


def search_airports(query: str, limit: int = 10) -> list[dict]:
    data = _request("GET", "/air/airports", params={"name": query, "limit": limit})
    return data.get("data", [])
