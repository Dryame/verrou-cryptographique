FROM python:3.12-slim

WORKDIR /app

# 1. Installation des dépendances (se fait en root, c'est normal)
COPY requirements.txt .
RUN pip install --default-timeout=1000 --retries 10 --no-cache-dir -r requirements.txt

# 2. Copie du code
COPY app ./app

# 3. Création de l'utilisateur non-root et attribution des droits sur le dossier /app
RUN useradd -m -r appuser && \
    chown -R appuser:appuser /app

# 4. Basculement sur cet utilisateur (tout ce qui suit s'exécute sans les droits root)
USER appuser

# 5. Commande de démarrage (inchangée)
CMD ["sh", "-c", "python -m app.migrate && uvicorn app.main:app --host 0.0.0.0 --port 8000"]