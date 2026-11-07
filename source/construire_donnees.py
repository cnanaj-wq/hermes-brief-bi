"""Construit data.js à partir de source/donnees_demo.json et vérifie les chiffres cités dans l'article.

python source/construire_donnees.py   ->   data.js
Aucun chiffre n'est saisi dans le site : tout est calculé ici, puis contrôlé contre les valeurs publiées.
"""
import json
from pathlib import Path

ICI = Path(__file__).parent
src = json.loads((ICI / "donnees_demo.json").read_text(encoding="utf-8"))


def r2(x):
    return round(x + 1e-9, 2)


# --- Réseau : marge brute = CA × taux affiché
magasins = []
for m in src["reseau"]:
    marge = [round(c * t) for c, t in zip(m["ca"], m["taux"])]
    magasins.append({"magasin": m["magasin"], "ca": m["ca"], "taux": m["taux"], "marge": marge,
                     "var_ca": r2((m["ca"][1] / m["ca"][0] - 1) * 100),
                     "var_marge": marge[1] - marge[0],
                     "var_marge_pct": r2((marge[1] / marge[0] - 1) * 100)})
tot_ca = [sum(m["ca"][i] for m in magasins) for i in (0, 1)]
tot_marge = [sum(m["marge"][i] for m in magasins) for i in (0, 1)]
reseau = {"ca": tot_ca, "marge": tot_marge, "taux": [r2(tot_marge[i] / tot_ca[i] * 100) for i in (0, 1)],
          "var_ca": r2((tot_ca[1] / tot_ca[0] - 1) * 100),
          "var_marge": tot_marge[1] - tot_marge[0],
          "var_marge_pct": r2((tot_marge[1] / tot_marge[0] - 1) * 100)}
reseau["var_taux_pts"] = r2((tot_marge[1] / tot_ca[1] - tot_marge[0] / tot_ca[0]) * 100)  # avant arrondi, comme le dashboard

# --- Lyon par produit
produits = []
for p in src["lyon_produits"]:
    marge = [p["ca"][i] - p["cout"][i] for i in (0, 1)]
    produits.append({**p, "marge": marge})
lyon = next(m for m in magasins if m["magasin"] == "Lyon")

# --- Contrôles : chiffres publiés dans l'article
assert reseau["ca"] == [390000, 421500] and reseau["marge"] == [156600, 152985]
assert reseau["var_ca"] == 8.08 and reseau["var_marge_pct"] == -2.31 and reseau["var_taux_pts"] == -3.86
assert lyon["marge"] == [50400, 38640] and lyon["var_marge"] == -11760
for i in (0, 1):  # le détail Lyon retrouve les totaux du dashboard réseau
    assert sum(p["ca"][i] for p in produits) == lyon["ca"][i]
    assert sum(p["marge"][i] for p in produits) == lyon["marge"][i]
acd = [p for p in produits if p["produit"] in "ACD"]
assert [sum(p["ca"][i] for p in acd) for i in (0, 1)] == [90000, 100000]
assert [sum(p["marge"][i] for p in acd) for i in (0, 1)] == [38400, 29520]
assert round(138000 * 0.28) == 38640  # test 4 : l'écart de 10 000 € avec 48 640 €

donnees = {"source": src["_source"], "periodes": src["periodes"], "reseau": reseau, "magasins": magasins,
           "produits": produits, "tests": src["tests"], "installation": src["installation"]}
(ICI.parent / "data.js").write_text(
    "// Généré par source/construire_donnees.py : ne pas modifier à la main\n"
    "window.HERMES = " + json.dumps(donnees, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8")
print("data.js écrit ·", len(magasins), "magasins ·", len(produits), "produits ·", len(src["tests"]), "tests")
