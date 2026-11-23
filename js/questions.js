/* Les questions du simulateur, dans l'ordre où elles sont posées (une étape par enveloppe).
   - A : les réponses par défaut, gardées dans le navigateur (clé fr-answers). La page d'accueil y écrit la réponse à sa question.
   - STEPS : une étape = un titre, un texte (lead) et ses questions (render). opt:'av' ajoute le bouton « je n'en ai pas » ;
     fineOnly:true : étape visible seulement après paiement ; fine(...) : champs visibles seulement après paiement.
   - opt(clé, valeur, libellé, aide) : un bouton de choix ; num(clé, unité, exemple) : un champ chiffré. */
function ld(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
var A = Object.assign({
  bank: 'trad', bankAmt: '', inc: 0, agios: 0, bankRise: H.bankRise,
  av: true, avV: 20000, avDep: 100, avType: 'net', avUC: 30, avFund: 'classic', avFv: '', avGE: '', avGU: '', avFF: '',
  pea: true, peaV: 5000, peaDep: 100, peaType: 'bank', peaFund: 'etf', peaGarde: '', peaOrdre: '', peaFF: '',
  years: H.years, rE: H.rE, rA: H.rA
}, ld('fr-answers', null) || {});

/* ===== Questions ===== */
function opt(key, val, label, hint) { return '<button type="button" data-k="' + key + '" data-v="' + val + '" aria-pressed="' + (String(A[key]) === String(val)) + '">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</button>'; }
function num(key, unit, ph, step) { return '<div class="num"><input type="number" inputmode="decimal" min="0" step="' + (step || 'any') + '" data-n="' + key + '" value="' + (A[key] === '' || A[key] == null ? '' : A[key]) + '" placeholder="' + (ph || '') + '"><span>' + unit + '</span></div>'; }
function fine(inner) { return unlocked ? '<div class="fine"><div class="t">Mode affiné : tes vrais frais (laisse vide pour garder la valeur par défaut)</div>' + inner + '</div>' : ''; }

var STEPS = [
  { id: 'bank', title: 'Ton compte courant', lead: 'Carte, tenue de compte, assurance des moyens de paiement, retraits : tout ce que ta banque prélève chaque année.',
    render: function () {
      return '<div class="f"><span class="lab">Tu es dans quelle banque ?</span><div class="opts">' +
        opt('bank', 'trad', 'Une banque traditionnelle, avec agence', 'On compte la moyenne 2025 : 229 € par an') +
        opt('bank', 'online', 'Une banque en ligne', 'Souvent gratuite sous conditions : on compte 0 €') +
        opt('bank', 'exact', 'Je connais mon montant', 'Il figure sur le récapitulatif annuel des frais que ta banque t\'envoie en janvier') + '</div></div>' +
        (A.bank === 'exact' ? '<div class="f"><label>Frais bancaires sur un an</label>' + num('bankAmt', '€ par an', '229') + '</div>' : '') +
        '<div class="f"><span class="lab">Il t\'arrive de payer des frais d\'incident (découvert, rejet) ?</span><div class="opts">' +
        opt('inc', 0, 'Jamais') + opt('inc', 3, 'Quelques fois par an', 'On compte 3 commissions de 8 €') + opt('inc', 12, 'Presque tous les mois', 'On compte 12 commissions de 8 €') + '</div></div>' +
        fine('<div class="row2"><div class="f"><label>Agios par an</label>' + num('agios', '€', '0') + '</div><div class="f"><label>Hausse des tarifs par an</label>' + num('bankRise', '%', '1,5') + '</div></div>');
    } },
  { id: 'av', title: 'Ton assurance-vie', lead: 'Si tu en as plusieurs, additionne-les. Les frais se prennent chaque année sur ton épargne, et l\'argent prélevé ne rapporte plus rien.', opt: 'av',
    render: function () {
      return '<div class="row2"><div class="f"><label>Montant aujourd\'hui</label>' + num('avV', '€', '20000') + '</div><div class="f"><label>Versement par mois</label>' + num('avDep', '€', '0') + '</div></div>' +
        '<div class="f"><span class="lab">Ton contrat vient d\'où ?</span><div class="opts">' +
        opt('avType', 'net', 'De ma banque ou d\'un assureur', 'Frais moyens du marché : 0,55 % sur versements, 0,67 à 0,88 % de gestion') +
        opt('avType', 'online', 'D\'un site en ligne', '0 % sur versements, 0,5 % de gestion') + '</div></div>' +
        '<div class="f"><span class="lab">Quelle part est en unités de compte (fonds, actions) ?</span><div class="opts two">' +
        opt('avUC', 0, 'Rien, tout en fonds euros') + opt('avUC', 30, 'Un peu, environ 30 %') + opt('avUC', 60, 'Plus de la moitié') + opt('avUC', 100, 'Presque tout') + '</div></div>' +
        (+A.avUC > 0 ? '<div class="f"><span class="lab">Ces unités de compte sont plutôt…</span><div class="opts">' +
        opt('avFund', 'classic', 'Des fonds choisis par la banque ou un conseiller', 'Frais des fonds : 1,60 % par an en moyenne') +
        opt('avFund', 'etf', 'Des ETF (fonds indiciels, « trackers »)', 'Frais des fonds : 0,33 % par an en moyenne') + '</div></div>' : '') +
        fine('<div class="row2"><div class="f"><label>Frais sur versement</label>' + num('avFv', '%', '') + '</div><div class="f"><label>Gestion fonds euros</label>' + num('avGE', '% par an', '') + '</div><div class="f"><label>Gestion UC</label>' + num('avGU', '% par an', '') + '</div><div class="f"><label>Frais des fonds UC</label>' + num('avFF', '% par an', '') + '</div></div>');
    } },
  { id: 'pea', title: 'Ton PEA ou compte-titres', lead: 'Droits de garde, frais de courtage à chaque achat, frais des fonds : ils sont plafonnés par la loi sur le PEA, mais pas nuls.', opt: 'pea',
    render: function () {
      return '<div class="row2"><div class="f"><label>Montant aujourd\'hui</label>' + num('peaV', '€', '5000') + '</div><div class="f"><label>Versement par mois</label>' + num('peaDep', '€', '0') + '</div></div>' +
        '<div class="f"><span class="lab">Il est ouvert où ?</span><div class="opts">' +
        opt('peaType', 'bank', 'Dans ma banque', 'On compte 0,25 % de droits de garde et 0,5 % par achat, sous les plafonds légaux') +
        opt('peaType', 'online', 'Chez un courtier en ligne', 'On compte 0 % de garde et 0,1 % par achat') + '</div></div>' +
        '<div class="f"><span class="lab">Tu y as surtout…</span><div class="opts">' +
        opt('peaFund', 'direct', 'Des actions en direct', 'Pas de frais de fonds') +
        opt('peaFund', 'etf', 'Des ETF (trackers)', '0,33 % par an en moyenne') +
        opt('peaFund', 'actions', 'Des fonds de la banque (SICAV, FCP)', '1,72 % par an en moyenne pour les fonds actions') + '</div></div>' +
        fine('<div class="row2"><div class="f"><label>Droits de garde</label>' + num('peaGarde', '% par an', '') + '</div><div class="f"><label>Frais par achat</label>' + num('peaOrdre', '%', '') + '</div><div class="f"><label>Frais des fonds</label>' + num('peaFF', '% par an', '') + '</div></div>');
    } },
  { id: 'hyp', title: 'Tes hypothèses', lead: 'Sur combien d\'années, et à quel rendement avant frais ? Les valeurs par défaut sont volontairement prudentes.', fineOnly: true,
    render: function () {
      return '<div class="f"><span class="lab">Durée</span><div class="opts two">' + opt('years', 10, '10 ans') + opt('years', 20, '20 ans') + opt('years', 25, '25 ans') + opt('years', 30, '30 ans') + '</div></div>' +
        '<div class="row2"><div class="f"><label>Fonds euros, avant frais</label>' + num('rE', '% par an', '3,2') + '</div><div class="f"><label>Actions et fonds, avant frais</label>' + num('rA', '% par an', '5') + '</div></div>';
    } }
];
function steps() { return STEPS.filter(function (s) { return !s.fineOnly || unlocked; }); }
