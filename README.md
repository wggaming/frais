# Ce que me coûtent mes frais

Simulateur statique (GitHub Pages) servi à https://frais.wagramconseil.fr : frais de banque, d'assurance-vie et de PEA additionnés sur 20 ans, intérêts perdus compris. Total gratuit, détail à 1 €.

- `index.html` : accueil, méthode et sources.
- `simulateur.html` : questionnaire, calcul, détail payant, PDF (librairies dans `vendor/`).
- `acheter.html` : formulaire (Web3Forms) puis paiement Mollie. Réglage : `PAYMENT_URL` (lien Mollie à 1 €, réutilisable, redirection vers `merci.html?t=…`).
- `merci.html` : activation après paiement.
- `codes.js` : empreintes PBKDF2 des codes `FR-XXXXX-XXXXX` (sel `codes-v2:frais`).
- `legal.html` : mentions légales, CGV, confidentialité (WG Conseil).
- `stats.js` : GoatCounter sans cookie (pages préfixées `/frais`).
