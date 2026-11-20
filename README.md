# Verrou Cryptographique

**Verrou Cryptographique** est une application open source de messagerie et de registre d'identités de bout en bout (E2EE), basée sur une architecture "zero-knowledge". 

Le serveur agit comme un annuaire de clés publiques et de récupération : **il ne détient ni les phrases secrètes, ni les clés privées, et ne peut donc pas déchiffrer vos messages.**

## Vision et Objectifs

La distribution et la révocation des clés publiques sont les maillons faibles des systèmes de messagerie sécurisée. Ce projet vise à fournir une alternative auditable et auto-hébergeable :
- Une identité cryptographique vérifiable (via empreinte BLAKE2b et code SAS).
- Un registre de clés publiques avec un mécanisme de révocation robuste.
- Un système de récupération de compte sécurisé (sans que le serveur ne puisse usurper l'identité).

## Fonctionnalités principales

- **Génération d'identité locale** : Génération de paires de clés (Ed25519) directement dans le navigateur via `libsodium.js`.
- **Chiffrement de bout en bout** : Les messages sont chiffrés côté client.
- **Registre de clés publiques** : Publication sécurisée et signée de la clé publique.
- **Vérification hors-bande** : Calcul d'un code SAS (Short Authentication String) permettant aux utilisateurs de vérifier leurs identités mutuelles.
- **Révocation** : Possibilité de révoquer une clé compromise.
- **Récupération zero-knowledge** : Un mécanisme de secours permet de restaurer l'accès sans transmettre la clé privée au serveur.

## Architecture technique

- **`backend/`** : API REST développée avec **FastAPI** (Python). Elle gère le registre (SQLAlchemy + PostgreSQL), vérifie les signatures (PyNaCl) et stocke les données de récupération chiffrées.
- **`frontend/`** : Application web **React + TypeScript** (via Vite). Elle contient toute la logique cryptographique sensible et utilise `libsodium.js`.

## Installation et Lancement (Développement)

### Prérequis
- Docker et Docker Compose
- Node.js (v18+) et npm
- Python 3.10+

### 1. Lancer le Backend et la Base de données
```bash
docker-compose up -d
