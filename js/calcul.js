/* Le calcul des frais, enveloppe par enveloppe (compte courant, assurance-vie, PEA), avec les chiffres de js/hypotheses.js.
   low = true : le même épargnant avec un profil « frais bas », pour la comparaison payante. */
/* ===== Calcul =====
   Simulation mois par mois. Chaque frais prélevé est suivi avec ce qu'il aurait rapporté s'il était resté placé :
   l'écart entre « sans aucun frais » et « avec tes frais » est exactement la somme de ces montants capitalisés. */
function pv(v, d) { return v === '' || v == null || isNaN(+v) ? d : +v; }
function simEnv(o) {
  // o : V0, dep (par mois), r (% an avant frais), fv (% versement), g (% an gestion), ff (% an fonds), garde (% an), ordre (% achat), years
  var rm = Math.pow(1 + o.r / 100, 1 / 12) - 1, V = o.V0, keys = ['fv', 'g', 'ff', 'garde', 'ordre'];
  var paid = {}, lost = {}, series = [];
  keys.forEach(function (k) { paid[k] = 0; lost[k] = 0; });
  for (var m = 1; m <= o.years * 12; m++) {
    var f = {};
    f.fv = o.dep * o.fv / 100; f.ordre = (o.dep - f.fv) * o.ordre / 100;
    V += o.dep - f.fv - f.ordre;
    f.g = V * o.g / 1200; f.ff = V * o.ff / 1200;
    f.garde = m % 12 === 0 ? V * o.garde / 100 : 0;
    V -= f.g + f.ff + f.garde;
    V *= 1 + rm;
    keys.forEach(function (k) { paid[k] += f[k]; lost[k] = (lost[k] + f[k]) * (1 + rm); });
    if (m % 12 === 0) series.push(keys.reduce(function (s, k) { return s + lost[k]; }, 0));
  }
  return { V: V, paid: paid, cost: lost, series: series, total: keys.reduce(function (s, k) { return s + lost[k]; }, 0) };
}
function avParams(a, low) {
  var base = a.avType === 'online' || low ? H.avOnline : H.avNet, uc = (+a.avUC || 0) / 100;
  var ffDef = low ? H.funds.etf : H.funds[a.avFund] || H.funds.classic;
  return { fv: low ? 0 : pv(a.avFv, base.fv), gE: low ? 0.5 : pv(a.avGE, base.gE), gU: low ? 0.5 : pv(a.avGU, base.gU), ff: low ? ffDef : pv(a.avFF, ffDef), uc: uc };
}
function computeAV(a, low) {
  if (!a.av) return null;
  var p = avParams(a, low), V0 = pv(a.avV, 0), dep = pv(a.avDep, 0), y = +a.years, out = [];
  var e = simEnv({ V0: V0 * (1 - p.uc), dep: dep * (1 - p.uc), r: pv(a.rE, H.rE), fv: p.fv, g: p.gE, ff: 0, garde: 0, ordre: 0, years: y });
  var u = simEnv({ V0: V0 * p.uc, dep: dep * p.uc, r: pv(a.rA, H.rA), fv: p.fv, g: p.gU, ff: p.ff, garde: 0, ordre: 0, years: y });
  var lines = [
    { l: 'Frais sur versements (' + fmtP(p.fv) + ')', paid: e.paid.fv + u.paid.fv, cost: e.cost.fv + u.cost.fv },
    { l: 'Frais de gestion du contrat (' + (p.uc < 1 ? fmtP(p.gE) + ' fonds euros' : '') + (p.uc > 0 && p.uc < 1 ? ', ' : '') + (p.uc > 0 ? fmtP(p.gU) + ' UC' : '') + ')', paid: e.paid.g + u.paid.g, cost: e.cost.g + u.cost.g },
    { l: 'Frais des fonds en UC (' + fmtP(p.ff) + ' par an)', paid: u.paid.ff, cost: u.cost.ff }
  ].filter(function (x) { return x.paid > 0.5 || (x.l.indexOf('fonds en UC') < 0 && x.l.indexOf('versements') < 0); });
  return { lines: lines, total: e.total + u.total, V: e.V + u.V, series: e.series.map(function (v, i) { return v + u.series[i]; }) };
}
function computePEA(a, low) {
  if (!a.pea) return null;
  var base = a.peaType === 'online' || low ? H.peaOnline : H.peaBank;
  var ffDef = a.peaFund === 'direct' ? 0 : low ? H.funds.etf : H.funds[a.peaFund] || 0;
  var p = { garde: low ? 0 : pv(a.peaGarde, base.garde), ordre: low ? H.peaOnline.ordre : pv(a.peaOrdre, base.ordre), ff: low ? ffDef : pv(a.peaFF, ffDef) };
  var r = simEnv({ V0: pv(a.peaV, 0), dep: pv(a.peaDep, 0), r: pv(a.rA, H.rA), fv: 0, g: 0, ff: p.ff, garde: p.garde, ordre: p.ordre, years: +a.years });
  var lines = [
    { l: 'Droits de garde (' + fmtP(p.garde) + ' par an)', paid: r.paid.garde, cost: r.cost.garde },
    { l: 'Frais de courtage à l\'achat (' + fmtP(p.ordre) + ')', paid: r.paid.ordre, cost: r.cost.ordre },
    { l: 'Frais des fonds (' + fmtP(p.ff) + ' par an)', paid: r.paid.ff, cost: r.cost.ff }
  ].filter(function (x) { return x.paid > 0.5; });
  return { lines: lines, total: r.total, V: r.V, series: r.series };
}
function computeBank(a, low) {
  var y = +a.years, rise = pv(a.bankRise, H.bankRise) / 100;
  var base = low ? H.bankOnline : a.bank === 'online' ? H.bankOnline : a.bank === 'exact' ? pv(a.bankAmt, H.bankTrad) : H.bankTrad;
  var inc = (+a.inc || 0) * H.incident + pv(a.agios, 0);
  var s1 = 0, s2 = 0, series = [];
  for (var i = 0; i < y; i++) { var k = Math.pow(1 + rise, i); s1 += base * k; s2 += inc * k; series.push(s1 + s2); }
  var lines = [{ l: 'Compte, carte et services (' + fmtE(base) + ' la première année)', paid: s1, cost: s1 }];
  if (inc > 0) lines.push({ l: 'Frais d\'incident et agios (' + fmtE(inc) + ' la première année)', paid: s2, cost: s2 });
  return { lines: lines, total: s1 + s2, series: series };
}
function compute(a, low) { return { bank: computeBank(a, low), av: computeAV(a, low), pea: computePEA(a, low) }; }

