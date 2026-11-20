#!/bin/bash
# ==============================================================================
# Script de correction finale des imports (Phase 6)
# Ce script garantit que security_middleware.py est au bon endroit.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION FINALE DES IMPORTS ===${NC}"

BACKEND_DIR="$PROJECT_ROOT/backend"
APP_DIR="$BACKEND_DIR/app"

# 1. S'assurer que le dossier app existe
mkdir -p "$APP_DIR"

# 2. S'assurer que le fichier security_middleware.py est dans app/
# On le recree au cas ou il aurait ete perdu lors des manipulations
cat << 'EOF' > "$APP_DIR/security_middleware.py"
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

def setup_security(app: FastAPI):
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response
EOF

echo -e "${GREEN}[OK] Fichier security_middleware.py place dans $APP_DIR${NC}"

# 3. Nettoyage des anciens fichiers mal places
if [ -f "$BACKEND_DIR/security_middleware.py" ]; then
    echo -e "${YELLOW}[ATTENTION] Suppression de l'ancien fichier mal place a la racine de backend/${NC}"
    rm "$BACKEND_DIR/security_middleware.py"
fi

# 4. Verification de l'import dans main.py
if [ -f "$APP_DIR/main.py" ]; then
    # On s'assure que l'import ne contient pas de chemin relatif bizarre
    sed -i 's/from app.security_middleware import/from security_middleware import/g' "$APP_DIR/main.py"
    echo -e "${GREEN}[OK] Import verifie dans main.py${NC}"
fi

# 5. Reconstruction et redemarrage
echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE L'IMAGE DOCKER ===${NC}"
docker-compose build backend
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

# 6. Verification
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "ModuleNotFoundError"; then
    echo -e "${RED}[ERREUR] L'erreur d'import persiste.${NC}"
    docker-compose logs --tail=10 backend
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'import.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE ===${NC}"
