/* Le fonctionnement de la page : questionnaire, résultat, accès payant, page A4 en PDF.
   Les réglages (prix, paiement, contact) sont dans reglages.js, les chiffres par défaut dans js/hypotheses.js,
   les questions dans js/questions.js et le calcul dans js/calcul.js. */
var unlocked = ld('fr-unlock', false) === true;
var done = ld('fr-done', false) === true;

var step = 0, started = false;

function renderStep() {
  var S = steps(), s = S[step];
  document.getElementById('prog').innerHTML = S.map(function (_, i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('');
  var off = s.opt && A[s.opt] === false;
  document.getElementById('stepbox').innerHTML = '<div class="step"><div class="eyebrow">Étape ' + (step + 1) + ' sur ' + S.length + '</div><h2>' + s.title + '</h2><p class="lead">' + s.lead + '</p>' +
    (off ? '<p style="margin-bottom:18px">Tu as indiqué ne pas en avoir. <button type="button" class="skip" style="display:inline;width:auto;padding:0" id="reon">J\'en ai un, finalement</button></p>' : s.render()) + '</div>';
  document.getElementById('back').hidden = step === 0;
  document.getElementById('next').textContent = step === S.length - 1 ? 'Voir ce que ça me coûte' : 'Continuer';
  var sk = document.getElementById('skip');
  sk.hidden = !s.opt || off;
  sk.textContent = s.id === 'av' ? 'Je n\'ai pas d\'assurance-vie' : 'Je n\'ai ni PEA ni compte-titres';
  var re = document.getElementById('reon'); if (re) re.onclick = function () { A[s.opt] = true; renderStep(); };
  Array.prototype.forEach.call(document.querySelectorAll('#stepbox [data-k]'), function (b) {
    b.onclick = function () { var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); A[k] = /^-?\d+(\.\d+)?$/.test(v) ? +v : v; sv('fr-answers', A); renderStep(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('#stepbox [data-n]'), function (inp) {
    inp.oninput = function () { var v = inp.value.replace(',', '.'); A[inp.getAttribute('data-n')] = v === '' ? '' : Math.max(0, +v); sv('fr-answers', A); };
  });
}
document.getElementById('next').onclick = function () {
  if (!started) { started = true; if (window.track) track('frais-debut-test'); }
  var S = steps(); if (step < S.length - 1) { step++; renderStep(); window.scrollTo(0, 0); } else showResults();
};
document.getElementById('back').onclick = function () { if (step > 0) { step--; renderStep(); } };
document.getElementById('skip').onclick = function () { var s = steps()[step]; A[s.opt] = false; sv('fr-answers', A); document.getElementById('next').onclick(); };

/* ===== Affichage ===== */
function fmtE(x) { return Math.round(x).toLocaleString('fr-FR').replace(/ /g, ' ') + ' €'; }
function fmtP(x) { return (Math.round(x * 100) / 100).toLocaleString('fr-FR') + ' %'; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var CATS = [{ k: 'bank', n: 'Compte courant', c: '--c-bank', hex: '#3657c9' }, { k: 'av', n: 'Assurance-vie', c: '--c-av', hex: '#c0731a' }, { k: 'pea', n: 'PEA ou compte-titres', c: '--c-pea', hex: '#0d6b57' }];
var last = null;

function showResults() {
  var R = compute(A, false), L = compute(A, true), y = +A.years;
  var tot = CATS.reduce(function (s, c) { return s + (R[c.k] ? R[c.k].total : 0); }, 0);
  last = { R: R, L: L, tot: tot, y: y };
  done = true; sv('fr-done', true); sv('fr-answers', A);
  if (window.track) track('frais-resultat');
  document.getElementById('quiz').hidden = true; document.getElementById('res').hidden = false;
  document.getElementById('r-k').textContent = 'Sur ' + y + ' ans';
  document.getElementById('r-big').textContent = fmtE(tot);
  document.getElementById('r-sub').textContent = 'soit ' + fmtE(tot / y / 12) + ' par mois en moyenne, intérêts perdus compris : chaque euro prélevé en frais aurait continué à rapporter.';
  var max = Math.max.apply(null, CATS.map(function (c) { return R[c.k] ? R[c.k].total : 0; })) || 1;
  document.getElementById('r-bars').innerHTML = CATS.filter(function (c) { return R[c.k]; }).map(function (c) {
    return '<div class="bar"><div class="l"><span>' + c.n + '</span><b>' + fmtE(R[c.k].total) + '</b></div><div class="t"><i style="width:' + Math.max(1.5, R[c.k].total / max * 100) + '%;background:var(' + c.c + ')"></i></div></div>';
  }).join('');
  document.getElementById('r-note').textContent = 'Estimation indicative en euros courants, hors fiscalité. Rendements avant frais retenus : ' + fmtP(pv(A.rE, H.rE)) + ' pour le fonds euros, ' + fmtP(pv(A.rA, H.rA)) + ' pour les actions et les fonds. Frais moyens du marché quand tu ne donnes pas les tiens (sources sur la page d\'accueil). Ce n\'est pas un conseil en investissement : le simulateur ne recommande aucun produit.';
  renderDetail();
  refreshAccess();
  loadPdfLibs().catch(function () {});
  window.scrollTo(0, 0);
}
function renderDetail() {
  if (!last || !unlocked) return;
  var R = last.R, L = last.L, y = last.y, rows = '<tr><th>Frais</th><th class="n">Payé</th><th class="n">Coût réel*</th></tr>';
  CATS.forEach(function (c) {
    if (!R[c.k]) return;
    rows += '<tr><td colspan="3" style="font-weight:800;padding-top:14px"><span class="dot" style="background:var(' + c.c + ')"></span>' + c.n + '</td></tr>';
    R[c.k].lines.forEach(function (x) { rows += '<tr><td>' + esc(x.l) + '</td><td class="n">' + fmtE(x.paid) + '</td><td class="n">' + fmtE(x.cost) + '</td></tr>'; });
  });
  var paid = CATS.reduce(function (s, c) { return s + (R[c.k] ? R[c.k].lines.reduce(function (t, x) { return t + x.paid; }, 0) : 0); }, 0);
  rows += '<tr class="tot"><td>Total sur ' + y + ' ans</td><td class="n">' + fmtE(paid) + '</td><td class="n">' + fmtE(last.tot) + '</td></tr>';
  rows += '<tr><td colspan="3" style="font-size:12.5px;color:var(--muted);border:0">* Coût réel : le frais payé, plus ce qu\'il aurait rapporté s\'il était resté placé jusqu\'au bout (hors compte courant, compté sans intérêts).</td></tr>';
  document.getElementById('t-det').innerHTML = rows;
  document.getElementById('chart').innerHTML = chartSVG(R, y, false);
  var ltot = CATS.reduce(function (s, c) { return s + (L[c.k] ? L[c.k].total : 0); }, 0), gain = Math.max(0, last.tot - ltot);
  last.ltot = ltot; last.paid = paid;
  var parts = CATS.filter(function (c) { return R[c.k]; }).map(function (c) { return c.n + ' : ' + fmtE(Math.max(0, R[c.k].total - L[c.k].total)); }).join(' · ');
  document.getElementById('save').innerHTML = '<div class="eyebrow">Avec des frais bas</div><div class="v">' + fmtE(gain) + ' de plus pour toi</div><p style="font-size:14.5px;margin-top:6px">' + parts + '</p><p style="font-size:13px;color:var(--muted);margin-top:8px">Profil « frais bas » : compte courant gratuit, assurance-vie sans frais sur versements avec 0,5 % de gestion et des ETF à 0,33 %, PEA sans droits de garde avec 0,1 % par achat. Mêmes placements, mêmes versements, mêmes incidents. Ce n\'est pas une recommandation de produit : compare les frais réels avant de changer.</p>';
}
function chartSVG(R, y, print) {
  var W = 600, Hh = 236, pl = 8, pb = 26, pt = 28, series = CATS.filter(function (c) { return R[c.k]; });
  var tot = []; for (var i = 0; i < y; i++) tot.push(series.reduce(function (s, c) { return s + R[c.k].series[i]; }, 0));
  var max = tot[y - 1] || 1, bw = (W - pl * 2) / y;
  var out = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Coût cumulé des frais année par année">';
  for (var j = 0; j < y; j++) {
    var base = Hh - pb;
    series.forEach(function (c) {
      var h = R[c.k].series[j] / max * (Hh - pb - pt);
      out += '<rect x="' + (pl + j * bw + 1.5) + '" y="' + (base - h) + '" width="' + Math.max(1, bw - 3) + '" height="' + h + '" fill="' + (print ? c.hex : 'var(' + c.c + ')') + '" rx="1.5"></rect>';
      base -= h;
    });
    if ((j + 1) % 5 === 0 || j === 0) out += '<text x="' + (pl + j * bw + bw / 2) + '" y="' + (Hh - 8) + '" text-anchor="middle" font-size="12" fill="' + (print ? '#5a6660' : 'currentColor') + '" opacity=".75">an ' + (j + 1) + '</text>';
  }
  out += '<text x="' + (W - pl) + '" y="' + (16) + '" text-anchor="end" font-size="13" font-weight="700" fill="' + (print ? '#17201c' : 'currentColor') + '">' + fmtE(max) + '</text></svg>';
  return out;
}

/* ===== Accès payant ===== */
function showLock(src) { var l = document.getElementById('lock'); if (window.track) track('frais-demande-' + src); l.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function refreshAccess() {
  document.getElementById('lock').hidden = unlocked;
  document.getElementById('det').hidden = !unlocked;
  document.getElementById('restart').textContent = unlocked ? 'Modifier mes réponses' : 'Modifier mes réponses (' + PRICE_LABEL + ')';
  document.getElementById('acc').textContent = unlocked ? 'Accès complet' : '';
  document.getElementById('pay').textContent = 'Voir le détail pour ' + PRICE_LABEL;
}
function tryUnlock(raw, via) {
  return window.checkCode(raw).then(function (ok) {
    if (ok) { unlocked = true; sv('fr-unlock', true); refreshAccess(); renderDetail(); if (window.track) track('frais-code-' + (window.lastCodeId || 'inconnu') + '-' + (via || 'champ')); }
    return ok;
  });
}
document.getElementById('codef').onsubmit = function (e) {
  e.preventDefault(); var m = document.getElementById('codemsg'); m.textContent = 'Vérification…';
  tryUnlock(document.getElementById('codein').value, 'champ').then(function (ok) { m.textContent = ok ? '' : 'Ce code n\'est pas reconnu. Vérifie-le (format FR-XXXXX-XXXXX).'; });
};
document.getElementById('pay').onclick = function () { if (window.track) track('frais-clic-achat'); };
function openQuiz() { step = 0; document.getElementById('res').hidden = true; document.getElementById('quiz').hidden = false; renderStep(); window.scrollTo(0, 0); }
document.getElementById('restart').onclick = function () { if (unlocked || !done) openQuiz(); else showLock('modif'); };
document.getElementById('refine').onclick = function () { openQuiz(); };
document.getElementById('sharebtn').onclick = function (e) {
  e.preventDefault(); var url = 'https://frais.wagramconseil.fr/', t = 'Combien te coûtent tes frais de banque, d\'assurance-vie et de PEA sur 20 ans ? Le calcul gratuit :';
  if (window.track) track('frais-partage');
  if (navigator.share) navigator.share({ title: 'Ce que me coûtent mes frais', text: t, url: url }).catch(function () {});
  else if (navigator.clipboard) navigator.clipboard.writeText(t + ' ' + url).then(function () { e.target.textContent = 'lien copié'; });
};

/* ===== PDF =====
   Les deux librairies (vendor/) ne sont chargées qu'une fois le résultat affiché, pour que le questionnaire s'ouvre plus vite. */
var pdfLibs = null;
function loadPdfLibs() {
  if (window.html2canvas && window.jspdf) return Promise.resolve();
  if (!pdfLibs) pdfLibs = ['vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js'].reduce(function (pr, src) {
    return pr.then(function () { return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { pdfLibs = null; ko(); }; document.head.appendChild(s); }); });
  }, Promise.resolve());
  return pdfLibs;
}
function buildA4() {
  var R = last.R, d = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), rows = '<tr><th>Frais</th><th class="n">Payé</th><th class="n">Coût réel</th></tr>';
  CATS.forEach(function (c) {
    if (!R[c.k]) return;
    rows += '<tr><td colspan="3" style="font-weight:800;padding-top:10px"><span class="dot" style="background:' + c.hex + '"></span>' + c.n + ' : ' + fmtE(R[c.k].total) + '</td></tr>';
    R[c.k].lines.forEach(function (x) { rows += '<tr><td>' + esc(x.l) + '</td><td class="n">' + fmtE(x.paid) + '</td><td class="n">' + fmtE(x.cost) + '</td></tr>'; });
  });
  document.getElementById('a4').innerHTML = '<div class="k">Simulation personnelle · ' + d + '</div><h1>Ce que me coûtent mes frais</h1>' +
    '<div class="bigA">' + fmtE(last.tot) + '</div><div style="font-size:15px;color:#5a6660">sur ' + last.y + ' ans, intérêts perdus compris, soit ' + fmtE(last.tot / last.y / 12) + ' par mois</div>' +
    '<table style="margin-top:22px">' + rows + '</table>' +
    '<div style="margin-top:18px">' + chartSVG(R, last.y, true) + '</div>' +
    '<div style="margin-top:14px;background:#e9ece7;border-radius:10px;padding:12px 14px;font-size:14px"><b>Avec des frais bas : ' + fmtE(Math.max(0, last.tot - last.ltot)) + ' de plus pour moi</b> (mêmes placements et versements, compte gratuit, assurance-vie et PEA à frais réduits).</div>' +
    '<div class="foot"><b style="color:#17201c;font-size:12px">Et toi, combien te coûtent tes frais ? Calcul gratuit sur <span style="color:#0d6b57">frais.wagramconseil.fr</span></b><br>Estimation indicative, en euros courants, hors fiscalité. Rendements avant frais : ' + fmtP(pv(A.rE, H.rE)) + ' (fonds euros), ' + fmtP(pv(A.rA, H.rA)) + ' (actions et fonds). Frais par défaut : moyennes publiées par Meilleurtaux (2025), France Assureurs et le CCSF (2025), plafonds PEA de l\'AMF. Ni conseil en investissement, ni recommandation de produit. Édité par WG Conseil.</div>';
}
document.getElementById('dl').onclick = async function () {
  var st = document.getElementById('dlstatus'), b = this;
  if (!last) return;
  b.disabled = true; st.textContent = 'Préparation de ta page A4…';
  try { await loadPdfLibs(); } catch (e) {}
  if (!window.html2canvas || !window.jspdf) { b.disabled = false; st.textContent = 'Le générateur de PDF n\'a pas pu se charger. Recharge la page.'; return; }
  try {
    buildA4(); if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var canvas = await html2canvas(document.getElementById('a4'), { scale: 2, backgroundColor: '#ffffff', width: 794, height: 1123, windowWidth: 794, x: 0, y: 0, scrollX: 0, scrollY: 0, onclone: function (doc) { doc.getElementById('a4').style.left = '0'; } });
    var pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, 210, 297);
    pdf.save('ce-que-me-coutent-mes-frais.pdf');
    if (window.track) track('frais-pdf');
    st.textContent = 'PDF téléchargé.';
  } catch (e) { st.textContent = 'Le PDF n\'a pas pu être créé. Réessaie.'; }
  finally { b.disabled = false; }
};

/* ===== Démarrage ===== */
(function () {
  var m = location.search.match(/[?&]code=([^&]+)/);
  var q = location.search.match(/[?&]bank=(trad|online|exact)/);
  if (q && !done) { A.bank = q[1]; }
  if (m) { tryUnlock(decodeURIComponent(m[1]), 'lien').then(function () { if (done) showResults(); }); history.replaceState(null, '', location.pathname); }
  if (done) showResults(); else renderStep();
  refreshAccess();
})();
