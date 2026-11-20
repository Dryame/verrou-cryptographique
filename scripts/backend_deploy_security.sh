#!/bin/bash
set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Définition des chemins absolus
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
ROUTERS_DIR="$BACKEND_DIR/routers"

echo -e "${BLUE}=== 🛡️ DÉPLOIEMENT DU BOUCLIER DE SÉCURITÉ ===${NC}"
echo -e "Dossier racine : ${YELLOW}$PROJECT_ROOT${NC}"
echo -e "Dossier backend: ${YELLOW}$BACKEND_DIR${NC}\n"

# 2. Création de l'arborescence
mkdir -p "$BACKEND_DIR"
mkdir -p "$ROUTERS_DIR"

# 3. Création du fichier security_middleware.py
SECURITY_FILE="$BACKEND_DIR/security_middleware.py"
echo -e "${GREEN}📝 Génération du fichier :${NC} $SECURITY_FILE"
cat << 'EOF' > "$SECURITY_FILE"
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

# 4. Injection dans main.py
MAIN_FILE=""
if [ -f "$BACKEND_DIR/main.py" ]; then
    MAIN_FILE="$BACKEND_DIR/main.py"
elif [ -f "$BACKEND_DIR/app/main.py" ]; then
    MAIN_FILE="$BACKEND_DIR/app/main.py"
else
    echo -e "${RED}❌ ERREUR : Impossible de trouver main.py dans $BACKEND_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}🔗 Injection de la sécurité dans :${NC} $MAIN_FILE"
cp "$MAIN_FILE" "${MAIN_FILE}.bak"

# Ajout de l'import
if ! grep -q "from security_middleware import setup_security" "$MAIN_FILE"; then
    sed -i '1i from security_middleware import setup_security\n' "$MAIN_FILE"
fi
# Ajout de l'initialisation
if ! grep -q "setup_security(app)" "$MAIN_FILE"; then
    sed -i '/app = FastAPI()/a setup_security(app)' "$MAIN_FILE"
fi

# 5. Création / Protection des routeurs sensibles
echo -e "${GREEN}🔒 Sécurisation des routes...${NC}"

protect_route_file() {
    FILE_PATH=$1
    ROUTE_NAME=$2
    
    echo -e " -> Traitement de : $FILE_PATH"
    if [ ! -f "$FILE_PATH" ]; then
        cat << EOF > "$FILE_PATH"
from fastapi import APIRouter, Request
from security_middleware import limiter

router = APIRouter()

@router.post("/$ROUTE_NAME")
@limiter.limit("5/minute")
async def handle_$ROUTE_NAME(request: Request):
    return {"message": "Route protégée"}
EOF
        echo -e "    ✅ Fichier créé avec succès."
    else
        cp "$FILE_PATH" "${FILE_PATH}.bak"
        # Ajout des imports
        grep -q "from fastapi import.*Request" "$FILE_PATH" || sed -i 's/from fastapi import /from fastapi import Request, /' "$FILE_PATH"
        grep -q "from security_middleware import limiter" "$FILE_PATH" || sed -i '1i from security_middleware import limiter\n' "$FILE_PATH"
        # Ajout du rate limit
        grep -q "@limiter.limit" "$FILE_PATH" || sed -i '/@router\.\(post\|put\|delete\)/a \    @limiter.limit("5/minute")' "$FILE_PATH"
        # Ajout de request: Request
        grep -q "request: Request" "$FILE_PATH" || perl -0777 -pi -e 's/(async def \w+\()/$1request: Request, /g' "$FILE_PATH"
        echo -e "    ✅ Fichier existant mis à jour."
    fi
}

protect_route_file "$ROUTERS_DIR/profils.py" "profils"
protect_route_file "$ROUTERS_DIR/recuperation.py" "recuperation"

# 6. Mise à jour de requirements.txt
cd "$BACKEND_DIR"
touch requirements.txt
if ! grep -q "slowapi" requirements.txt; then
    echo "slowapi" >> requirements.txt
    echo -e "${GREEN}📦 'slowapi' ajouté à requirements.txt${NC}"
fi

echo -e "\n${BLUE}=== ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ===${NC}"
echo -e "Chemins générés :"
echo -e " - ${YELLOW}$SECURITY_FILE${NC}"
echo -e " - ${YELLOW}$MAIN_FILE${NC}"
echo -e " - ${YELLOW}$ROUTERS_DIR/profils.py${NC}"
echo -e " - ${YELLOW}$ROUTERS_DIR/recuperation.py${NC}"
echo -e "\n${YELLOW}⚠️  Note : Des sauvegardes (.bak) de vos fichiers existants ont été créées.${NC}"
