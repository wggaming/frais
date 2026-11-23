# Ce que me coûtent mes frais

Simulateur statique (GitHub Pages) servi à https://frais.wagramconseil.fr : frais de banque, d'assurance-vie et de PEA additionnés sur 20 ans, intérêts perdus compris. Total gratuit, détail à 1 €. Pas d'étape de construction : chaque fichier est servi tel quel.

## Où modifier quoi

| Je veux changer… | Fichier |
| --- | --- |
| Le prix affiché, le lien de paiement Mollie, l'adresse de contact, la clé du formulaire | `reglages.js` (vaut pour toutes les pages sauf `legal.html`) |
| Un chiffre par défaut : frais bancaires moyens, frais d'assurance-vie, frais des fonds, plafonds PEA, rendements, durée | `js/hypotheses.js` (et la source sur `index.html#methode`) |
| Une question, un choix de réponse, son texte d'aide, une réponse par défaut | `js/questions.js` |
| La façon de calculer (frais sur versement, gestion, intérêts perdus, profil « frais bas ») | `js/calcul.js` |
| Le résultat, l'encart payant, la page A4 en PDF | `js/simulateur.js` |
| Une couleur (dont celles des trois enveloppes) | `site.css` (et les couleurs `hex` de `CATS` dans `js/simulateur.js` pour le PDF) |
| Les textes de l'accueil, la méthode et les sources | `index.html` |
| La question posée dès l'accueil (« Tu es dans quelle banque ? ») | `index.html` (bloc `qstart` et son script en bas de page) |
| Les codes de déblocage acceptés | `codes.js` (empreintes produites par l'outil privé) |
| Les mentions légales, CGV, confidentialité | `legal.html` (garde sa propre copie de l'adresse et du prix) |

## Les fichiers

- `index.html` : accueil, première question du test, méthode et sources. La réponse est enregistrée dans le navigateur et reprise dans le test.
- `simulateur.html` : le questionnaire et le résultat.
  - `js/hypotheses.js`, `js/questions.js`, `js/calcul.js` : les chiffres, les questions et le calcul.
  - `js/simulateur.js` : le fonctionnement de la page (questionnaire, accès payant, résultat, page A4).
  - `vendor/` : les deux librairies du PDF, chargées seulement une fois le résultat affiché.
- `acheter.html` : formulaire (Web3Forms) puis paiement Mollie. `merci.html` : activation après paiement (lien Mollie redirigé vers `merci.html?t=…`).
- `codes.js` : empreintes PBKDF2 des codes `FR-XXXXX-XXXXX` (sel `codes-v2:frais`).
- `legal.html` : mentions légales, CGV, confidentialité (WG Conseil).
- `stats.js` : GoatCounter sans cookie (pages préfixées `/frais`). Réponses à la question d'accueil : événements `frais-accueil-banque-trad`, `-online`, `-exact`.
