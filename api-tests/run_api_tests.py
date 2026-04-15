#!/usr/bin/env python3
"""Simple API smoke tests for backend endpoints."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


DEFAULT_TIMEOUT = 20

# -----------------------------------------------------------------------------
# Configurazione rapida (modifica questi valori direttamente nel file se vuoi)
# -----------------------------------------------------------------------------
DEFAULT_BASE_URL = "https://api.generatoredocumentazionetecnica.it/api"
DEFAULT_ADMIN_USER = "matt"
DEFAULT_ADMIN_PASS = ""


@dataclass
class TestResult:
    name: str
    ok: bool
    details: str = ""


def _join(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def _auth_header(username: str, password: str) -> str:
    token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def request_json(
    method: str,
    url: str,
    *,
    body: dict[str, Any] | None = None,
    auth: tuple[str, str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> tuple[int, dict[str, Any], str]:
    headers = {"Accept": "application/json"}
    payload: bytes | None = None

    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    if auth is not None:
        headers["Authorization"] = _auth_header(auth[0], auth[1])

    req = urllib.request.Request(url=url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        status = exc.code
        raw = exc.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        return 0, {}, f"Request error: {exc}"

    data: dict[str, Any] = {}
    if raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                data = parsed
        except json.JSONDecodeError:
            return status, {}, f"Non-JSON response: {raw[:200]}"

    return status, data, raw[:200]


def run_tests(base_url: str, admin_user: str | None, admin_pass: str | None) -> int:
    results: list[TestResult] = []

    status, data, details = request_json("GET", _join(base_url, "health"))
    results.append(TestResult("GET /health", status == 200 and data.get("status") == "ok", details))

    status, data, details = request_json("GET", _join(base_url, "templates"))
    templates_ok = status == 200 and isinstance(data.get("templates"), list)
    results.append(TestResult("GET /templates", templates_ok, details))

    if not (admin_user and admin_pass):
        print_results(results)
        print("\nAdmin credentials missing: skipped auth/admin/database flow.")
        return 0 if all(result.ok for result in results) else 1

    test_user = f"api_test_{int(time.time())}"
    test_pass = "ApiTestPass123!"
    test_user_id: int | None = None

    status, data, details = request_json(
        "POST",
        _join(base_url, "auth/register"),
        body={"username": test_user, "password": test_pass},
    )
    results.append(TestResult("POST /auth/register", status == 201, details))

    status, data, details = request_json(
        "GET",
        _join(base_url, "admin/pending-users"),
        auth=(admin_user, admin_pass),
    )
    pending_users = data.get("users", []) if isinstance(data, dict) else []
    if isinstance(pending_users, list):
        for user in pending_users:
            if isinstance(user, dict) and user.get("username") == test_user:
                test_user_id = user.get("id")
                break
    results.append(
        TestResult(
            "GET /admin/pending-users",
            status == 200 and isinstance(test_user_id, int),
            details,
        )
    )

    if isinstance(test_user_id, int):
        status, data, details = request_json(
            "POST",
            _join(base_url, f"admin/users/{test_user_id}/approve"),
            auth=(admin_user, admin_pass),
        )
        results.append(TestResult("POST /admin/users/<id>/approve", status == 200, details))
    else:
        results.append(
            TestResult(
                "POST /admin/users/<id>/approve",
                False,
                "Skipped: test user id not found in pending users.",
            )
        )

    status, data, details = request_json(
        "POST",
        _join(base_url, "auth/check"),
        auth=(test_user, test_pass),
    )
    auth_check_ok = status == 200 and data.get("ok") is True and data.get("username") == test_user
    results.append(TestResult("POST /auth/check", auth_check_ok, details))

    status, data, details = request_json(
        "GET",
        _join(base_url, "admin/users"),
        auth=(admin_user, admin_pass),
    )
    admin_users_ok = status == 200 and isinstance(data.get("users"), list)
    results.append(TestResult("GET /admin/users", admin_users_ok, details))

    if isinstance(test_user_id, int):
        status, data, details = request_json(
            "DELETE",
            _join(base_url, f"admin/users/{test_user_id}"),
            auth=(admin_user, admin_pass),
        )
        results.append(TestResult("DELETE /admin/users/<id>", status == 200, details))
    else:
        results.append(
            TestResult(
                "DELETE /admin/users/<id>",
                False,
                "Skipped: missing test user id for cleanup.",
            )
        )

    print_results(results)
    return 0 if all(result.ok for result in results) else 1


def print_results(results: list[TestResult]) -> None:
    print("\nAPI test results")
    print("=" * 60)
    for result in results:
        symbol = "PASS" if result.ok else "FAIL"
        suffix = f" - {result.details}" if result.details else ""
        print(f"[{symbol}] {result.name}{suffix}")
    print("=" * 60)
    passed = sum(1 for item in results if item.ok)
    print(f"Passed: {passed}/{len(results)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run backend API smoke tests.")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("API_BASE_URL", DEFAULT_BASE_URL),
        help="API base URL (example: https://domain.tld/api)",
    )
    parser.add_argument(
        "--admin-user",
        default=os.environ.get("API_ADMIN_USER", DEFAULT_ADMIN_USER),
        help="Admin username for protected endpoints",
    )
    parser.add_argument(
        "--admin-pass",
        default=os.environ.get("API_ADMIN_PASS", DEFAULT_ADMIN_PASS),
        help="Admin password for protected endpoints",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    base_url = args.base_url.strip()
    if not base_url:
        print("Missing base URL. Use --base-url or API_BASE_URL.")
        return 2
    return run_tests(base_url, args.admin_user.strip() or None, args.admin_pass.strip() or None)


if __name__ == "__main__":
    sys.exit(main())

