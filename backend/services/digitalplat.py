"""DigitalPlat FreeDomain API client — domain registration & management."""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

BASE_URL = "https://dash.domain.digitalplat.org"

# Available TLDs
TLDS = [".dpdns.org", ".us.kg", ".qzz.io", ".xx.kg", ".qd.je"]


class DigitalPlatClient:
    """Client for DigitalPlat FreeDomain API.

    Supports two auth modes:
    1. API key (Bearer token) — for server-to-server calls
    2. Session cookie — obtained via email/password login
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.session: Optional[str] = None
        self._client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=15,
            follow_redirects=True,
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()

    def _auth_headers(self) -> dict:
        """Build auth headers from available credentials."""
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if self.session:
            headers["Cookie"] = f"session={self.session}"
        return headers

    async def login(self, email: str, password: str) -> bool:
        """Create a session via email/password login.

        Returns True if login succeeded.
        """
        try:
            resp = await self._client.post(
                "/auth/login",
                data={"email": email, "password": password},
            )
            if resp.status_code == 200 and "session" in resp.cookies:
                self.session = resp.cookies.get("session")
                logger.info("DigitalPlat: logged in as %s", email)
                return True
            logger.warning("DigitalPlat login failed: %s", resp.status_code)
            return False
        except httpx.HTTPError as e:
            logger.error("DigitalPlat login error: %s", e)
            return False

    async def check_domain(
        self, name: str, tld: str = ".qzz.io"
    ) -> dict:
        """Check if a domain is available.

        Returns dict with keys: available (bool), domain (str), message (str)
        """
        if tld not in TLDS:
            return {"available": False, "domain": f"{name}{tld}", "message": f"Invalid TLD: {tld}"}

        url = f"/panel/register/check"
        params = {"name": name, "domain": tld}

        try:
            resp = await self._client.get(
                url, params=params, headers=self._auth_headers()
            )
            text = resp.text.lower()

            if resp.status_code == 200:
                # Check response for availability indicators
                if "available" in text or "not taken" in text or "is free" in text:
                    return {"available": True, "domain": f"{name}{tld}", "message": "Domain is available"}
                elif "taken" in text or "unavailable" in text or "already registered" in text:
                    return {"available": False, "domain": f"{name}{tld}", "message": "Domain already registered"}
                else:
                    return {"available": False, "domain": f"{name}{tld}", "message": f"Unknown response: {text[:200]}"}

            return {"available": False, "domain": f"{name}{tld}", "message": f"HTTP {resp.status_code}"}

        except httpx.HTTPError as e:
            logger.error("DigitalPlat domain check error: %s", e)
            return {"available": False, "domain": f"{name}{tld}", "message": str(e)}

    async def register_domain(
        self, name: str, tld: str = ".qzz.io", nameservers: Optional[list[str]] = None
    ) -> dict:
        """Register a domain on DigitalPlat FreeDomain.

        Args:
            name: Domain name (without TLD)
            tld: One of the supported TLDs
            nameservers: Optional list of nameserver hostnames

        Returns dict with: success (bool), domain (str), message (str)
        """
        if tld not in TLDS:
            return {"success": False, "domain": f"{name}{tld}", "message": f"Invalid TLD: {tld}"}

        # Default to Cloudflare nameservers if none specified
        if not nameservers:
            nameservers = []

        try:
            # Step 1: Check availability first
            check = await self.check_domain(name, tld)
            if not check["available"]:
                return {"success": False, "domain": check["domain"], "message": check["message"]}

            # Step 2: Submit registration via /panel/register/buy
            data = {
                "ns1": nameservers[0] if len(nameservers) > 0 else "",
                "ns2": nameservers[1] if len(nameservers) > 1 else "",
                "ns3": nameservers[2] if len(nameservers) > 2 else "",
                "ns4": nameservers[3] if len(nameservers) > 3 else "",
            }

            # Registration also needs the domain name — sent via query or form
            resp = await self._client.post(
                f"/panel/register/buy?name={name}&domain={tld}",
                data=data,
                headers=self._auth_headers(),
            )

            if resp.status_code in (200, 302):
                return {"success": True, "domain": f"{name}{tld}", "message": "Domain registered successfully"}
            else:
                return {"success": False, "domain": f"{name}{tld}", "message": f"Registration failed: HTTP {resp.status_code}"}

        except httpx.HTTPError as e:
            logger.error("DigitalPlat register error: %s", e)
            return {"success": False, "domain": f"{name}{tld}", "message": str(e)}

    async def list_domains(self) -> dict:
        """List domains owned by the authenticated account.

        Returns dict with: domains (list), count (int)
        """
        try:
            resp = await self._client.get(
                "/api/v1/domains",
                headers=self._auth_headers(),
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"domains": data if isinstance(data, list) else data.get("domains", []), "count": len(data) if isinstance(data, list) else data.get("count", 0)}
            return {"domains": [], "count": 0, "error": f"HTTP {resp.status_code}"}
        except httpx.HTTPError as e:
            logger.error("DigitalPlat list domains error: %s", e)
            return {"domains": [], "count": 0, "error": str(e)}

    async def get_account(self) -> dict:
        """Get authenticated account info."""
        try:
            resp = await self._client.get(
                "/api/v1/me",
                headers=self._auth_headers(),
            )
            if resp.status_code == 200:
                return {"success": True, "account": resp.json()}
            return {"success": False, "error": f"HTTP {resp.status_code}"}
        except httpx.HTTPError as e:
            logger.error("DigitalPlat account error: %s", e)
            return {"success": False, "error": str(e)}

    async def close(self):
        await self._client.aclose()
