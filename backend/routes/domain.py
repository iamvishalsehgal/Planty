"""Domain management routes — DigitalPlat FreeDomain integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import config
from ..services.digitalplat import DigitalPlatClient, TLDS

router = APIRouter(prefix="/domain", tags=["domain"])


class CheckDomainRequest(BaseModel):
    name: str
    tld: str = ".qzz.io"


class RegisterDomainRequest(BaseModel):
    name: str
    tld: str = ".qzz.io"


@router.get("/tlds")
async def list_tlds():
    """List available FreeDomain TLDs."""
    return {"tlds": TLDS}


@router.post("/check")
async def check_domain(req: CheckDomainRequest):
    """Check if a domain is available on DigitalPlat FreeDomain."""
    api_key = config.DIGITALPLAT_API_KEY
    async with DigitalPlatClient(api_key=api_key) as client:
        result = await client.check_domain(req.name, req.tld)
    return result


@router.post("/register")
async def register_domain(req: RegisterDomainRequest):
    """Register a domain on DigitalPlat FreeDomain."""
    api_key = config.DIGITALPLAT_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="DIGITALPLAT_API_KEY not configured")

    async with DigitalPlatClient(api_key=api_key) as client:
        result = await client.register_domain(req.name, req.tld)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/status")
async def domain_status():
    """Get Planty domain registration status."""
    domain = config.PLANTY_DOMAIN
    api_key = config.DIGITALPLAT_API_KEY
    name, _, tld = domain.partition(".")

    async with DigitalPlatClient(api_key=api_key) as client:
        check = await client.check_domain(name, f".{tld}")
    return {
        "domain": domain,
        "available": check.get("available", False),
        "message": check.get("message", "Unknown"),
    }
