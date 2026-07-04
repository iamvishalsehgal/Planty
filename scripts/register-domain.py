#!/usr/bin/env python3
"""Register a free domain on DigitalPlat and update Planty config.

Usage:
  python3 scripts/register-domain.py <name> [tld]

Examples:
  python3 scripts/register-domain.py planty .us.kg
  python3 scripts/register-domain.py planty .dpdns.org

Requires: DIGITALPLAT_API_KEY in .env or DIGITALPLAT_API_KEY env var.
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services.digitalplat import DigitalPlatClient, TLDS
import asyncio


async def register(name: str, tld: str, api_key: str):
    """Register a domain and return result."""
    async with DigitalPlatClient(api_key=api_key) as client:
        # Step 1: Check availability
        print(f"Checking {name}{tld}...")
        check = await client.check_domain(name, tld)

        if not check["available"]:
            print(f"❌ {name}{tld} is NOT available: {check['message']}")
            return None

        print(f"✅ {name}{tld} is available!")

        # Step 2: Register
        print(f"Registering {name}{tld}...")
        result = await client.register_domain(name, tld)

        if result["success"]:
            print(f"✅ Registered: {result['domain']}")
            print(f"   {result['message']}")
            return result
        else:
            print(f"❌ Registration failed: {result['message']}")
            return None


async def check_all(name: str):
    """Check availability across all TLDs (no auth needed for check)."""
    print(f"\nChecking all TLDs for '{name}'...\n")
    async with DigitalPlatClient() as client:
        for tld in TLDS:
            result = await client.check_domain(name, tld)
            icon = "🟢" if result["available"] else "🔴"
            print(f"  {icon} {name}{tld} — {result['message']}")


async def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nAvailable TLDs:", ", ".join(TLDS))
        sys.exit(1)

    name = sys.argv[1]
    tld = sys.argv[2] if len(sys.argv) > 2 else ".us.kg"

    if tld not in TLDS:
        print(f"Invalid TLD: {tld}")
        print("Available:", ", ".join(TLDS))
        sys.exit(1)

    # Get API key
    api_key = os.getenv("DIGITALPLAT_API_KEY", "")

    # Also try loading from .env
    if not api_key:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("DIGITALPLAT_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if not api_key:
        print("\n❌ DIGITALPLAT_API_KEY not set!")
        print("\nOptions:")
        print("  1. Create .env file with: DIGITALPLAT_API_KEY=dp_live_...")
        print("  2. Export env var: export DIGITALPLAT_API_KEY=dp_live_...")
        print("\nGet your API key from: https://dash.domain.digitalplat.org")
        print("\nMeanwhile, checking availability (no auth needed)...")
        await check_all(name)
        sys.exit(1)

    result = await register(name, tld, api_key)

    if result:
        domain = result["domain"]
        print(f"\n✅ SUCCESS! Domain ready: {domain}")
        print(f"\nNext steps:")
        print(f"  1. Update public/CNAME → {domain}")
        print(f"  2. Bump sw.js CACHE version")
        print(f"  3. git commit && git push → auto-deploys")

        # Auto-update CNAME if we're sure
        cname_path = Path(__file__).resolve().parent.parent / "public" / "CNAME"
        print(f"\n   Current CNAME: {cname_path.read_text().strip()}")

        update = input(f"\n   Update CNAME to '{domain}'? [y/N]: ")
        if update.lower() == 'y':
            cname_path.write_text(domain + "\n")
            print(f"   ✅ CNAME updated → {domain}")
    else:
        print("\n❌ Registration failed. Check all TLDs:")
        await check_all(name)


if __name__ == "__main__":
    asyncio.run(main())
