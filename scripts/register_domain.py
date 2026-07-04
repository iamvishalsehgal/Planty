#!/usr/bin/env python3
"""Register planty.qzz.io via DigitalPlat FreeDomain API.

Usage:
    DIGITALPLAT_API_KEY=dp_live_xxx python3 scripts/register_domain.py
    DIGITALPLAT_API_KEY=dp_live_xxx python3 scripts/register_domain.py --name myapp --tld .us.kg
"""

import argparse
import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.digitalplat import DigitalPlatClient, TLDS


async def main():
    parser = argparse.ArgumentParser(description="Register a FreeDomain via DigitalPlat")
    parser.add_argument("--name", default="planty", help="Domain name (without TLD)")
    parser.add_argument("--tld", default=".qzz.io", choices=TLDS, help="Top-level domain")
    parser.add_argument("--check-only", action="store_true", help="Only check availability, don't register")
    args = parser.parse_args()

    api_key = os.environ.get("DIGITALPLAT_API_KEY", "")
    if not api_key:
        print("ERROR: DIGITALPLAT_API_KEY env var not set.")
        print("Get your API key from https://dash.domain.digitalplat.org")
        sys.exit(1)

    domain = f"{args.name}{args.tld}"
    print(f"Domain: {domain}")
    print(f"TLD: {args.tld}")
    print()

    async with DigitalPlatClient(api_key=api_key) as client:
        # Step 1: Check account
        print("Checking API key...")
        account = await client.get_account()
        if account.get("success"):
            print(f"  ✓ Authenticated")
        else:
            print(f"  ⚠ API returned: {account.get('error', 'unknown')}")
            print("  (Will try domain check anyway...)")
        print()

        # Step 2: Check availability
        print(f"Checking availability for {domain}...")
        check = await client.check_domain(args.name, args.tld)
        if check.get("available"):
            print(f"  ✓ {domain} is AVAILABLE!")
        else:
            print(f"  ✗ {check.get('message', 'Not available')}")

        if args.check_only:
            return

        if not check.get("available"):
            print("\nDomain not available. Try a different name with --name")
            sys.exit(1)

        # Step 3: Register
        print(f"\nRegistering {domain}...")
        result = await client.register_domain(args.name, args.tld)
        if result.get("success"):
            print(f"  ✓ SUCCESS! {domain} registered.")
            print(f"\nNext steps:")
            print(f"  1. Set up DNS (Cloudflare or other provider)")
            print(f"  2. Add CNAME: {domain} → iamvishalsehgal.github.io")
            print(f"  3. GitHub Settings → Pages → Custom domain: {domain}")
            print(f"  4. Enable HTTPS")
        else:
            print(f"  ✗ FAILED: {result.get('message', 'Unknown error')}")
            print(f"\nTry manually at: https://dash.domain.digitalplat.org")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
