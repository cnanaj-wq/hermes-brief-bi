/* Hermes : le brief BI dans Telegram · logique du dashboard (sans dépendance).
   Toutes les valeurs viennent de data.js, généré par source/construire_donnees.py. */
(() => {
  "use strict";
  const D = window.HERMES;
  const $ = (s, r = document) => r.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";

  const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const eur = v => nf0.format(v) + " €";
  const signe = (v, f) => (v > 0 ? "+" : v < 0 ? "−" : "") + f(Math.abs(v));
  const pct = v => nf2.format(v) + " %";
  const pts = v => signe(v, x => nf2.format(x)) + " pts";
  const classe = v => (v > 0 ? "pos" : v < 0 ? "neg" : "");
  const echap = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const svg = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };

  const kpi = (lib, val, cmp) =>
    `<div class="kpi"><p class="kpi__lib">${lib}</p><p class="kpi__val">${val}</p><p class="kpi__cmp">${cmp}</p></div>`;

  const largeur = c => Math.max(300, Math.min(c.clientWidth || 560, 720));

  /* Barres horizontales groupées (août, septembre) */
  function barresGroupees(cible, lignes, { surClic, titre } = {}) {
    cible.textContent = "";
    if (!lignes.length) { cible.innerHTML = '<p class="vide">Aucun produit sélectionné.</p>'; return; }
    const larg = largeur(cible), gauche = 92, droite = 78, hBarre = 16, ecart = 4, hLigne = hBarre * 2 + ecart + 18;
    const max = Math.max(...lignes.flatMap(l => [l.a, l.b]), 1);
    const echelle = v => (v / max) * (larg - gauche - droite);
    const s = svg("svg", { width: larg, height: lignes.length * hLigne, viewBox: `0 0 ${larg} ${lignes.length * hLigne}`, role: "img", "aria-label": titre || "" });
    lignes.forEach((l, i) => {
      const y = i * hLigne;
      const g = svg("g", {}, s);
      if (surClic) {
        g.setAttribute("class", "cliquable");
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-pressed", String(!!l.actif));
        g.setAttribute("aria-label", `${l.label} : août ${eur(l.a)}, septembre ${eur(l.b)}. ${l.actif ? "Retirer de" : "Ajouter à"} la sélection`);
        g.addEventListener("click", () => surClic(l.cle));
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); surClic(l.cle); } });
      }
      svg("rect", { class: "fond-ligne", x: 0, y: y + 1, width: larg, height: hLigne - 6, rx: 6, fill: "transparent" }, g);
      const t = svg("text", { x: 8, y: y + hBarre + 4 }, g); t.textContent = l.label;
      const opacite = l.actif === false ? 0.28 : 1;
      [[l.a, "#0f7f86", 0], [l.b, "#d0782a", hBarre + ecart]].forEach(([v, c, dy]) => {
        svg("rect", { class: "barre", x: gauche, y: y + 4 + dy, width: Math.max(echelle(v), 1), height: hBarre, rx: 3, fill: c, "fill-opacity": opacite }, g);
        const tv = svg("text", { class: "val", x: gauche + echelle(v) + 6, y: y + 4 + dy + 12.5 }, g); tv.textContent = nf0.format(v);
      });
    });
    cible.appendChild(s);
    const leg = document.createElement("p");
    leg.className = "legende";
    leg.innerHTML = '<span class="leg-aout">Août</span><span class="leg-sept">Septembre</span><span>Valeurs en euros</span>';
    cible.appendChild(leg);
  }

  /* Barres de contribution (variations négatives vers la gauche) */
  function contributions(cible, lignes) {
    cible.textContent = "";
    if (!lignes.length) { cible.innerHTML = '<p class="vide">Aucun produit sélectionné.</p>'; return; }
    const larg = largeur(cible), gauche = 92, hLigne = 40, marge = 70;
    const max = Math.max(...lignes.map(l => Math.abs(l.v)), 1);
    const zero = lignes.some(l => l.v > 0) ? gauche + (larg - gauche) / 2 : larg - marge;
    const dispo = lignes.some(l => l.v > 0) ? (larg - gauche) / 2 - marge : zero - gauche - marge;
    const s = svg("svg", { viewBox: `0 0 ${larg} ${lignes.length * hLigne + 8}`, role: "img", "aria-label": "Contributions à la variation de marge brute" });
    svg("line", { x1: zero, x2: zero, y1: 0, y2: lignes.length * hLigne + 8, stroke: "#c6cfdc" }, s);
    lignes.forEach((l, i) => {
      const y = i * hLigne + 6, w = (Math.abs(l.v) / max) * dispo;
      const t = svg("text", { x: 8, y: y + 18 }, s); t.textContent = l.label;
      const x = l.v < 0 ? zero - w : zero;
      svg("rect", { class: "barre", x, y, width: Math.max(w, 1), height: 26, rx: 3, fill: l.v < 0 ? "#b9382f" : "#0f7b5f" }, s);
      const tv = svg("text", { class: "val", x: l.v < 0 ? x - 6 : x + w + 6, y: y + 18, "text-anchor": l.v < 0 ? "end" : "start" }, s);
      tv.textContent = signe(l.v, nf0.format);
    });
    cible.appendChild(s);
  }

  /* ------------------------------------------------ 1. Brief réseau */
  function pageBrief() {
    const r = D.reseau;
    $("#kpis-reseau").innerHTML =
      kpi("Chiffre d'affaires", eur(r.ca[1]), `Août : ${eur(r.ca[0])} · <span class="${classe(r.var_ca)}">${signe(r.var_ca, nf1.format)} %</span>`) +
      kpi("Marge brute", eur(r.marge[1]), `Août : ${eur(r.marge[0])} · <span class="${classe(r.var_marge)}">${signe(r.var_marge_pct, nf1.format)} %</span>`) +
      kpi("Taux de marge brute", pct(r.taux[1]), `Août : ${pct(r.taux[0])} · <span class="neg">${pts(r.var_taux_pts)}</span>`);

    grapheMagasins();

    const lignes = D.magasins.map(m => `<tr${m.var_marge < 0 ? ' class="alerte"' : ""}><td>${m.magasin}</td><td>${eur(m.ca[0])}</td><td>${eur(m.ca[1])}</td><td>${nf0.format(m.taux[0] * 100)} %</td><td>${nf0.format(m.taux[1] * 100)} %</td><td class="${classe(m.var_marge)}">${signe(m.var_marge, eur)}</td></tr>`).join("");
    $("#t-magasins").innerHTML = `<caption class="visuellement-cache">Chiffre d'affaires et taux de marge par magasin</caption>
      <thead><tr><th scope="col">Magasin</th><th scope="col">CA août</th><th scope="col">CA sept.</th><th scope="col">Taux août</th><th scope="col">Taux sept.</th><th scope="col">Δ marge</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr><td>Réseau</td><td>${eur(r.ca[0])}</td><td>${eur(r.ca[1])}</td><td>${nf2.format(r.taux[0])} %</td><td>${nf2.format(r.taux[1])} %</td><td class="neg">${signe(r.var_marge, eur)}</td></tr></tfoot>`;

    const ly = D.magasins.find(m => m.magasin === "Lyon");
    $("#brief-bot").innerHTML = `
      <p><strong>Trois constats chiffrés, faits</strong></p>
      <ul>
        <li>CA du réseau : ${eur(r.ca[1])} contre ${eur(r.ca[0])}, <span class="pos">+${eur(r.ca[1] - r.ca[0])}</span>.</li>
        <li>Marge brute en baisse malgré la croissance : ${eur(r.marge[1])} contre ${eur(r.marge[0])}, <span class="neg">${signe(r.var_marge, eur)}</span>.</li>
        <li>Taux de marge : ${pct(r.taux[0])} → ${pct(r.taux[1])}, <span class="neg">${pts(r.var_taux_pts)}</span>.</li>
      </ul>
      <p><strong>Magasin prioritaire : Lyon.</strong> CA +${nf0.format(ly.var_ca)} %, mais taux de 42 % à 28 % : marge brute ${eur(ly.marge[0])} → ${eur(ly.marge[1])}, <span class="neg">${signe(ly.var_marge, eur)} (${signe(ly.var_marge_pct, nf1.format)} %)</span>. Paris et Bordeaux compensent une partie de la baisse.</p>
      <p><strong>Hypothèses, pas conclusions</strong> : remises, coûts ou mix pourraient contribuer à la baisse ; les données fournies ne permettent d'attribuer aucune cause.</p>`;
  }

  function grapheMagasins() {
    barresGroupees($("#g-magasins"), D.magasins.map(m => ({ label: m.magasin, a: m.marge[0], b: m.marge[1] })), { titre: "Marge brute par magasin, août et septembre" });
  }
  const redessiner = () => { grapheMagasins(); majLyon(); };

  /* ------------------------------------------------ 2. Exploration Lyon */
  const DEFAUT = ["A", "C", "D"];
  let selection = new Set(DEFAUT);
  let mesure = "marge";
  const LIB_MESURE = { marge: "Marge brute", ca: "CA net HT", cout: "Coût des ventes" };

  function pageLyon() {
    const zone = $("#puces-produits");
    zone.innerHTML = D.produits.map(p => `<button type="button" class="puce" data-produit="${p.produit}" aria-pressed="false">Produit ${p.produit}</button>`).join("");
    zone.addEventListener("click", e => { const b = e.target.closest("[data-produit]"); if (b) basculer(b.dataset.produit); });
    $("#tout-produits").addEventListener("click", () => { selection = new Set(D.produits.map(p => p.produit)); majLyon(); });
    $("#reinit-produits").addEventListener("click", () => { selection = new Set(DEFAUT); majLyon(); });
    $("#choix-mesure").addEventListener("change", e => { mesure = e.target.value; majLyon(); });
    majLyon();
  }
  function basculer(p) { selection.has(p) ? selection.delete(p) : selection.add(p); majLyon(); }

  function majLyon() {
    document.querySelectorAll("[data-produit]").forEach(b => b.setAttribute("aria-pressed", String(selection.has(b.dataset.produit))));
    const sel = D.produits.filter(p => selection.has(p.produit));
    const tous = sel.length === D.produits.length;
    $("#tout-produits").disabled = tous;
    $("#reinit-produits").disabled = sel.length === 3 && DEFAUT.every(p => selection.has(p));
    $("#lib-selection").textContent = sel.length ? `Sélection : ${sel.map(p => "produit " + p.produit).join(" + ")}${tous ? " (tout Lyon)" : ""}` : "Aucun produit sélectionné";

    const somme = (k, i) => sel.reduce((s, p) => s + p[k][i], 0);
    const ca = [somme("ca", 0), somme("ca", 1)], mg = [somme("marge", 0), somme("marge", 1)];
    const tx = ca.map((c, i) => (c ? (mg[i] / c) * 100 : 0));
    const dCa = ca[0] ? (ca[1] / ca[0] - 1) * 100 : 0, dMg = mg[1] - mg[0], dMgP = mg[0] ? (dMg / mg[0]) * 100 : 0, dTx = tx[1] - tx[0];
    $("#kpis-lyon").innerHTML = sel.length
      ? kpi("CA net HT · septembre", eur(ca[1]), `Août : ${eur(ca[0])} · <span class="${classe(dCa)}">${signe(dCa, nf2.format)} %</span>`) +
        kpi("Marge brute · septembre", eur(mg[1]), `Août : ${eur(mg[0])} · <span class="${classe(dMg)}">${signe(dMg, eur)} · ${signe(dMgP, nf2.format)} %</span>`) +
        kpi("Taux de marge · septembre", pct(tx[1]), `Août : ${pct(tx[0])} · <span class="${classe(dTx)}">${pts(dTx)}</span>`)
      : "";

    $("#titre-mesure").textContent = LIB_MESURE[mesure] + " par produit";
    barresGroupees($("#g-produits"), D.produits.map(p => ({ cle: p.produit, label: "Produit " + p.produit, a: p[mesure][0], b: p[mesure][1], actif: selection.has(p.produit) })),
      { surClic: basculer, titre: LIB_MESURE[mesure] + " par produit, août et septembre" });

    const contrib = sel.map(p => ({ label: "Produit " + p.produit, v: p.marge[1] - p.marge[0] })).sort((a, b) => a.v - b.v);
    contributions($("#g-contrib"), contrib);
    const baisses = contrib.filter(c => c.v < 0);
    const top2 = baisses.slice(0, 2), totBaisse = baisses.reduce((s, c) => s + c.v, 0);
    $("#note-contrib").textContent = sel.length
      ? `Vérification : ${contrib.map(c => signe(c.v, nf0.format)).join(" ")} = ${signe(dMg, eur)}, exactement la variation de la sélection.` +
        (top2.length === 2 && dMg < 0 ? ` ${top2.map(c => c.label.replace("Produit ", "")).join(" et ")} représentent ${nf2.format((top2[0].v + top2[1].v) / totBaisse * 100)} % de la baisse de cette sélection, pas de l'ensemble de Lyon.` : "")
      : "";

    $("#analyse-bot").innerHTML = sel.length ? `
      <p><strong>Données fictives, démonstration.</strong> Périmètre : Lyon, ${sel.map(p => p.produit).join(", ")} uniquement.</p>
      <p><strong>Totaux de la sélection</strong> : CA ${eur(ca[0])} → ${eur(ca[1])} (<span class="${classe(dCa)}">${signe(dCa, nf2.format)} %</span>) ; marge brute ${eur(mg[0])} → ${eur(mg[1])} (<span class="${classe(dMg)}">${signe(dMg, eur)}</span>) ; taux ${pct(tx[0])} → ${pct(tx[1])}, calculé sur les totaux sans moyenner les taux produits.</p>
      <p><strong>Trois questions au responsable</strong></p>
      <ol>
        <li>Quelles quantités et quels prix nets unitaires chaque mois pour ${sel.map(p => p.produit).join(", ")} ?</li>
        <li>Quelles promotions ou remises, à quelles dates et sur quelles ventes ?</li>
        <li>Comment les coûts d'achat unitaires et la composition des ventes ont-ils évolué ?</li>
      </ol>
      <p>Ces contributions comptables ne prouvent aucune cause.</p>` : "<p>Sélectionnez au moins un produit, puis l'analyse revient ici.</p>";
  }

  /* ------------------------------------------------ 3. Cinq tests */
  function pageTests() {
    $("#kpis-tests").innerHTML =
      kpi("Tests métier", D.tests.length, "sur données fictives") +
      kpi("Erreur repérée", "10 000 €", "test 4 · 138 000 × 0,28") +
      kpi("Cause inventée", "0", "test 2 · « ne prouve pas sa cause »") +
      kpi("Écart d'arrondi", "0,01 pt", "test 5 · signalé, non corrigé");
    $("#liste-tests").innerHTML = D.tests.map(t => `
      <article class="test">
        <p class="test__num">Test ${t.id}</p>
        <h3>${echap(t.titre)}</h3>
        <p class="message message--moi">${echap(t.demande)}</p>
        <p class="message message--bot">${echap(t.reponse)}</p>
        <p class="verdict">${echap(t.verdict)}</p>
      </article>`).join("");
  }

  /* ------------------------------------------------ 4. Installation */
  function pageInstallation() {
    const n = e => D.installation.filter(i => i.etat === e).length;
    $("#kpis-installation").innerHTML =
      kpi("Étapes faites", n("fait"), "du VPS au premier aller-retour") +
      kpi("À réaliser", n("a_faire"), "contrôle des ports, alertes npm") +
      kpi("Prévue", n("prevu"), "reverse proxy pour un accès web");
    const LIB = { fait: "fait", a_faire: "à réaliser", prevu: "prévu" };
    $("#etapes").innerHTML = D.installation.map(i => `<li class="${i.etat}"><div><strong>${echap(i.etape)}<span class="etat">${LIB[i.etat]}</span></strong><p>${echap(i.detail)}</p></div></li>`).join("");
    $("#flux").innerHTML = `
      <div class="noeud"><strong>Telegram</strong><span>Bot et API de messagerie · un seul utilisateur autorisé</span></div>
      <p class="lien-flux">HTTPS sortant, polling initié par le VPS</p>
      <div class="noeud noeud--vps"><strong>VPS Ubuntu · compte hermes sans sudo</strong><span>Passerelle Hermes (service systemd) · agent, outils limités, mémoire, skills</span></div>
      <p class="lien-flux">HTTPS sortant : les messages sont transmis au modèle</p>
      <div class="noeud"><strong>Fournisseur du modèle IA</strong><span>Inférence externe, choisie dans l'assistant de configuration</span></div>
      <div class="noeud noeud--prevu"><strong>Prévu : reverse proxy HTTPS</strong><span>Pour un futur accès web ; port applicatif jamais exposé directement</span></div>`;
  }

  /* ------------------------------------------------ onglets accessibles */
  function onglets() {
    const boutons = [...document.querySelectorAll('[role="tab"]')];
    const afficher = (nom, focus) => {
      boutons.forEach(b => {
        const actif = b.dataset.page === nom;
        b.setAttribute("aria-selected", String(actif));
        b.tabIndex = actif ? 0 : -1;
        $("#" + b.getAttribute("aria-controls")).hidden = !actif;
        if (actif && focus) b.focus();
      });
      if (location.hash !== "#" + nom) history.replaceState(null, "", "#" + nom);
      redessiner();
    };
    boutons.forEach((b, i) => {
      b.addEventListener("click", () => afficher(b.dataset.page));
      b.addEventListener("keydown", e => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); afficher(boutons[(i + d + boutons.length) % boutons.length].dataset.page, true); }
        if (e.key === "Home") { e.preventDefault(); afficher(boutons[0].dataset.page, true); }
        if (e.key === "End") { e.preventDefault(); afficher(boutons[boutons.length - 1].dataset.page, true); }
      });
    });
    const initial = location.hash.slice(1);
    afficher(boutons.some(b => b.dataset.page === initial) ? initial : "brief");
    window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (boutons.some(b => b.dataset.page === h)) afficher(h); });
  }

  let minuteur;
  window.addEventListener("resize", () => { clearTimeout(minuteur); minuteur = setTimeout(redessiner, 150); });
  pageBrief(); pageLyon(); pageTests(); pageInstallation(); onglets();
})();
