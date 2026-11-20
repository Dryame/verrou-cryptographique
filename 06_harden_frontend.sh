#!/bin/bash
# ==============================================================================
# Script de securisation du Frontend (Phase 3 - Bouclier 7)
# Ce script injecte une CSP stricte et audite le code React contre les failles XSS.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INDEX_FILE="$FRONTEND_DIR/index.html"

echo -e "${BLUE}[INFO] === SECURISATION DU FRONTEND ===${NC}"

# ==============================================================================
# 1. Injection de la Content Security Policy (CSP) dans index.html
# ==============================================================================
if [ -f "$INDEX_FILE" ]; then
    echo -e "${GREEN}[OK] Fichier trouve :${NC} $INDEX_FILE"
    cp "$INDEX_FILE" "${INDEX_FILE}.bak"

    # Verification si la CSP n'est pas deja presente
    if ! grep -q "Content-Security-Policy" "$INDEX_FILE"; then
        # La CSP autorise :
        # - 'self' : le site lui-meme
        # - 'wasm-unsafe-eval' : OBLIGATOIRE pour libsodium.js (WebAssembly)
        # - 'unsafe-inline' : pour les styles (souvent requis par React/Vite)
        CSP_META='<meta http-equiv="Content-Security-Policy" content="default-src '"'"'self'"'"'; script-src '"'"'self'"'"' '"'"'wasm-unsafe-eval'"'"'; style-src '"'"'self'"'"' '"'"'unsafe-inline'"'"'; img-src '"'"'self'"'"' data:; connect-src '"'"'self'"'"' http://localhost:8000; object-src '"'"'none'"'"';">'

        # Injection juste apres la balise <head>
        sed -i "s|<head>|<head>\n    $CSP_META|" "$INDEX_FILE"
        echo -e "${GREEN}[OK] Content Security Policy (CSP) injectee avec succes.${NC}"
    else
        echo -e "${YELLOW}[ATTENTION] La CSP est deja presente dans index.html.${NC}"
    fi
else
    echo -e "${RED}[ERREUR] Fichier index.html introuvable dans $FRONTEND_DIR${NC}"
fi

# ==============================================================================
# 2. Audit des failles XSS dans le code React/TypeScript
# ==============================================================================
echo -e "\n${BLUE}[INFO] === AUDIT DES RISQUES XSS DANS LE CODE ===${NC}"
echo -e "Recherche de pratiques dangereuses (eval, dangerouslySetInnerHTML, etc.)..."

XSS_FOUND=0

# Recherche de dangerouslySetInnerHTML
if grep -rn "dangerouslySetInnerHTML" "$FRONTEND_DIR/src" 2>/dev/null; then
    echo -e "${RED}[DANGER] 'dangerouslySetInnerHTML' detecte. Cela contourne la protection XSS de React.${NC}"
    XSS_FOUND=1
fi

# Recherche de eval()
if grep -rn "eval(" "$FRONTEND_DIR/src" 2>/dev/null; then
    echo -e "${RED}[DANGER] 'eval()' detecte. L'execution de code dynamique est une faille majeure.${NC}"
    XSS_FOUND=1
fi

# Recherche de innerHTML (hors fichiers de test)
if grep -rn "\.innerHTML" "$FRONTEND_DIR/src" 2>/dev/null | grep -v "test" ; then
    echo -e "${RED}[DANGER] 'innerHTML' detecte. Utilisez plutot textContent.${NC}"
    XSS_FOUND=1
fi

if [ $XSS_FOUND -eq 0 ]; then
    echo -e "${GREEN}[OK] Aucun risque XSS evident (eval, innerHTML) n'a ete detecte dans le code source.${NC}"
else
    echo -e "${YELLOW}[ACTION REQUISE] Des pratiques dangereuses ont ete trouvees. Veuillez inspecter les fichiers listes ci-dessus.${NC}"
fi

echo -e "\n${BLUE}[INFO] === SECURISATION DU FRONTEND TERMINEE ===${NC}"
