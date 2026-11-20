from fastapi import APIRouter, Request

from app.schemas import ProfilCreate
from app.security_middleware import limiter

router = APIRouter()


@router.post("/profils")
@limiter.limit("5/minute")
async def handle_profils(request: Request, profil: ProfilCreate):
    return {"message": "Profil recu et valide", "data": profil.model_dump()}
