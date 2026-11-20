# Politique de Securite

## Signaler une vulnerabilite
Si vous decouvrez une faille de securite dans ce projet, veuillez **NE PAS** creer d'issue publique sur GitHub. 
Veuillez envoyer un e-mail a l'adresse de contact du mainteneur (indiquez votre adresse email ici). 
Nous nous engageons a vous repondre dans les plus brefs delais.

## Modele de Menace
- **Serveur honnete mais curieux** : Le serveur ne detient aucune cle privee ni phrase secrete.
- **Serveur malveillant** : Les signatures Ed25519 empechent la falsification des cles publiques.
- **Attaques XSS** : Le frontend est protege par une CSP stricte. La securite des cles privees repose sur la machine de l'utilisateur.
- **Perte d'appareil** : Le systeme de recuperation zero-knowledge permet de restaurer l'acces.

## Statut Actuel
Ce projet est en cours de deploiement. Il n'a pas encore fait l'objet d'un audit de securite externe independant.
