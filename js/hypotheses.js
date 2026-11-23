/* Les chiffres par défaut du simulateur, tous sourcés (sources détaillées sur index.html#methode).
   Pour mettre à jour une moyenne (frais bancaires, frais d'assurance-vie, plafonds PEA, rendements), c'est ici.
   - bankTrad : frais annuels d'une banque traditionnelle (€), bankOnline : banque en ligne, bankRise : hausse par an (%), incident : commission d'intervention (€)
   - avNet : assurance-vie de banque ou d'assureur (fv : frais sur versement %, gE : gestion fonds euros %, gU : gestion UC %), avOnline : contrat en ligne
   - funds : frais internes des fonds par an (%), peaBank / peaOnline : droits de garde par an et frais par achat (%)
   - rE : rendement du fonds euros avant frais, rA : actions et fonds, years : durée par défaut */
/* ===== Hypothèses sourcées (voir index.html#methode) =====
   Banque : 228,90 € par an en moyenne en 2025 (Meilleurtaux, février 2025), hausse de 1,7 % sur un an.
   Commission d'intervention : plafonnée à 8 € par opération (art. R312-4-1 du Code monétaire et financier).
   Assurance-vie (France Assureurs, mai 2026 ; CCSF, juin 2026, chiffres 2025) : frais de gestion 0,67 % fonds euros
   et 0,88 % UC (moyenne pondérée), frais sur versement 0,55 % ; frais internes des fonds UC 1,60 %, ETF 0,33 %,
   fonds actions 1,72 %.
   PEA (AMF, plafonds en vigueur depuis le 1er juillet 2020) : droits de garde 0,4 % maximum par an, ordres 0,5 %
   maximum en ligne. */
var H = {
  bankTrad: 229, bankOnline: 0, bankRise: 1.5, incident: 8,
  avNet: { fv: 0.55, gE: 0.67, gU: 0.88 }, avOnline: { fv: 0, gE: 0.5, gU: 0.5 },
  funds: { classic: 1.60, etf: 0.33, actions: 1.72, direct: 0 },
  peaBank: { garde: 0.25, ordre: 0.5 }, peaOnline: { garde: 0, ordre: 0.1 },
  rE: 3.2, rA: 5, years: 20
};
