from fastapi import APIRouter, Request
from app.security_middleware import limiter

router = APIRouter()

@router.post("/recuperation")
@limiter.limit("5/minute")
async def handle_recuperation(request: Request):
    return {"message": "Route protégée"}
