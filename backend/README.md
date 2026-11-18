# Registre de clés VERROU

En développement local, définissez d’abord un mot de passe PostgreSQL aléatoire et
URL-safe dans la variable d’environnement `POSTGRES_PASSWORD` (par exemple avec
`export POSTGRES_PASSWORD="$(openssl rand -hex 32)"`), puis démarrez PostgreSQL et l’API
avec `docker compose up --build`.
L’API est disponible sur `http://localhost:8000`. Le frontend utilise cette adresse
par défaut en mode développement; définissez `VITE_API_BASE_URL` pour un autre registre.

Le registre reçoit le nom d’affichage, un sel aléatoire non secret, les clés publiques et
une signature de preuve de possession. Il ne reçoit ni phrase secrète ni clé privée.
Le code de récupération est une clé privée distincte : le navigateur la garde chiffrée
avec l’identité locale, ne l’envoie jamais au serveur et ne l’exporte pas en fichier clair.
La requête de révocation ne transmet que sa signature. Le code autorise la révocation,
mais ne permet pas de retrouver l’ancienne clé privée ni les anciens messages.

Les clients vérifient l’état d’une identité auprès du registre avant de chiffrer ou
déchiffrer. En production, hébergez l’API derrière HTTPS et définissez `CORS_ORIGINS`
ainsi que `VITE_API_BASE_URL` avec les origines HTTPS réellement utilisées.
