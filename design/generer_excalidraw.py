"""Génère les schémas Excalidraw du projet (modifiables sur excalidraw.com : Menu > Ouvrir).
python design/generer_excalidraw.py  ->  design/fil-du-projet.excalidraw, design/architecture.excalidraw
"""
import json
import random
from pathlib import Path

ICI = Path(__file__).parent
random.seed(20261104)
COUL = {"jaune": "#fff3bf", "bleu": "#d0ebff", "violet": "#e5dbff", "orange": "#ffe8cc", "vert": "#d3f9d8",
        "gris": "#e9ecef", "sarcelle": "#c3fae8", "rose": "#ffdeeb", "blanc": "#ffffff"}


class Schema:
    def __init__(self):
        self.el = []

    def _base(self, t, x, y, w, h, **k):
        e = {"id": f"{t[:3]}{len(self.el)}", "type": t, "x": x, "y": y, "width": w, "height": h, "angle": 0,
             "strokeColor": k.get("trait", "#1e1e1e"), "backgroundColor": k.get("fond", "transparent"),
             "fillStyle": "solid", "strokeWidth": k.get("epaisseur", 2), "strokeStyle": k.get("style", "solid"),
             "roughness": 1, "opacity": 100, "groupIds": [], "frameId": None, "roundness": k.get("arrondi"),
             "seed": random.randint(1, 2**31), "version": 1, "versionNonce": random.randint(1, 2**31),
             "isDeleted": False, "boundElements": [], "updated": 1, "link": None, "locked": False}
        self.el.append(e)
        return e

    def texte(self, x, y, w, h, txt, taille=20, conteneur=None, align="center", couleur="#1e1e1e"):
        # une ligne = un élément : rendu identique dans toutes les versions d'Excalidraw
        e = None
        for i, ligne in enumerate(txt.split(chr(10))):
            if not ligne:
                continue
            e = self._base("text", x, y + i * taille * 1.25, w, taille * 1.25, trait=couleur)
            e.update({"text": ligne, "fontSize": taille, "fontFamily": 1, "textAlign": align,
                      "verticalAlign": "top", "containerId": None, "originalText": ligne,
                      "lineHeight": 1.25, "baseline": int(taille * 0.9), "autoResize": True})
        return e

    def boite(self, x, y, w, h, txt, fond="blanc", taille=18, style="solid", trait="#1e1e1e"):
        r = self._base("rectangle", x, y, w, h, fond=COUL.get(fond, fond), style=style, trait=trait, arrondi={"type": 3})
        lignes = txt.count("\n") + 1
        self.texte(x + 10, y + h / 2 - lignes * taille * 0.625, w - 20, lignes * taille * 1.25, txt, taille)
        return r

    def fleche(self, a, b, label=None, style="solid", vertical=False, montant=False):
        if montant:
            x1, y1 = a["x"] + a["width"] / 2, a["y"]
            x2, y2 = b["x"] + b["width"] / 2, b["y"] + b["height"]
        elif vertical:
            x1, y1 = a["x"] + a["width"] / 2, a["y"] + a["height"]
            x2, y2 = b["x"] + b["width"] / 2, b["y"]
        else:
            x1, y1 = a["x"] + a["width"], a["y"] + a["height"] / 2
            x2, y2 = b["x"], b["y"] + b["height"] / 2
        e = self._base("arrow", x1, y1, x2 - x1, y2 - y1, style=style)
        e.update({"points": [[0, 0], [x2 - x1, y2 - y1]], "lastCommittedPoint": None,
                  "startBinding": {"elementId": a["id"], "focus": 0, "gap": 6},
                  "endBinding": {"elementId": b["id"], "focus": 0, "gap": 6},
                  "startArrowhead": None, "endArrowhead": "arrow", "elbowed": False})
        a["boundElements"].append({"type": "arrow", "id": e["id"]})
        b["boundElements"].append({"type": "arrow", "id": e["id"]})
        if label:
            if x1 == x2 or vertical or montant:
                self.texte((x1 + x2) / 2 + 12, (y1 + y2) / 2 - 10, 200, 20, label, 14, align="left", couleur="#495057")
            else:
                self.texte((x1 + x2) / 2 - 110, (y1 + y2) / 2 - 26, 220, 20, label, 14, couleur="#495057")
        return e

    def ecrire(self, nom):
        doc = {"type": "excalidraw", "version": 2, "source": "https://excalidraw.com", "elements": self.el,
               "appState": {"viewBackgroundColor": "#ffffff", "gridSize": None}, "files": {}}
        (ICI / f"{nom}.excalidraw").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")


# ---------------------------------------------------------------- 1. Fil du projet (vue métier)
s = Schema()
s.texte(40, 20, 1600, 40, "Hermes Agent : du VPS au brief BI dans Telegram", 32, align="left")
s.boite(40, 90, 2100, 70, "Question métier : le CA progresse, la marge recule. L'assistant voit-il le problème... et refuse-t-il d'en inventer la cause ?", "jaune", 22, trait="#e8590c")
etapes = [
    ("1. LE BESOIN\n\n« Réunion dans\ncinq minutes »\n\nCA +8,1 %\nmarge brute -2,3 %", "jaune", "Acteur : responsable\ncommercial"),
    ("2. DES CHIFFRES FIABLES\n\n« Les calculs\nsont-ils justes ? »\n\nmarge = CA x taux\nerreur de 10 000 € repérée", "bleu", "Outil : modèle IA via Hermes\n· test 4"),
    ("3. COMPRENDRE\n\n« Où se forme\nl'écart ? »\n\nLyon : -11 760 €\nde marge (-23,3 %)", "bleu", "Outil : capture du dashboard\ndans Telegram · test 1"),
    ("4. NE PAS EXTRAPOLER\n\n« La promo explique-\nt-elle tout ? »\n\ncause non prouvée\ndonnées manquantes nommées", "violet", "Outil : prompt faits /\nhypothèses · tests 2 et 3"),
    ("5. AGIR\n\n« Que demander\nau responsable ? »\n\nA, C, D : -8 880 €\n3 questions prêtes", "orange", "Outil : mini-application\nTelegram · test 5"),
    ("6. APPRENDRE\n\n« Que reste-t-il\nà durcir ? »\n\nports, alertes npm,\nreverse proxy", "vert", "Outil : hermes doctor,\nufw, nmap"),
]
prec = None
for i, (txt, fond, outil) in enumerate(etapes):
    x = 40 + i * 355
    b = s.boite(x, 210, 300, 270, txt, fond, 19)
    s.boite(x + 20, 505, 260, 64, outil, "gris", 14, "dashed", "#868e96")
    if prec:
        s.fleche(prec, b)
    prec = b
s.texte(40, 610, 800, 30, "Garanties de confiance, en continu", 22, align="left")
for i, g in enumerate(["Accès restreint\nun seul identifiant Telegram autorisé\npolling sortant, aucun port web entrant",
                       "Moindre privilège\ncompte hermes sans sudo,\noutils optionnels non installés",
                       "Secrets hors des captures\njetons, .env et journaux bruts\njamais publiés",
                       "Faits d'abord\nchaque chiffre recalculable,\naucune cause inventée"]):
    s.boite(40 + i * 530, 650, 500, 100, g, "gris", 16, "dashed", "#868e96")
s.ecrire("fil-du-projet")

# ---------------------------------------------------------------- 2. Architecture
a = Schema()
a.texte(40, 20, 1600, 40, "Architecture : Telegram, Hermes sur VPS, modèle IA externe", 32, align="left")
a.boite(420, 290, 900, 420, "", "transparent", 16, "dashed", "#868e96")
a.texte(820, 300, 480, 24, "VPS Ubuntu 24.04 · compte hermes sans sudo", 18, align="left", couleur="#495057")
user = a.boite(40, 90, 300, 120, "Utilisateur autorisé\ntéléphone · question\n+ capture du dashboard", "jaune", 17)
tg = a.boite(460, 90, 340, 120, "Telegram\nbot et API de messagerie\nTELEGRAM_ALLOWED_USERS", "bleu", 17)
gw = a.boite(460, 350, 340, 140, "Passerelle Hermes\nservice systemd utilisateur\npolling : connexion sortante\naucun webhook public", "sarcelle", 16)
ag = a.boite(900, 350, 380, 140, "Agent Hermes\noutils limités · mémoire · skills\nvalidations conservées\nsecrets protégés (.env)", "sarcelle", 16)
ia = a.boite(1440, 350, 340, 140, "Fournisseur du modèle IA\ninférence externe\nchoisie dans l'assistant\nde configuration", "rose", 16)
mini = a.boite(40, 350, 300, 140, "Mini-application HTTPS\nservie hors du VPS\nsélection de produits\n« Analyser ma sélection »", "orange", 16)
adm = a.boite(460, 560, 340, 110, "Administration\nSSH par clé · compte admin séparé\nufw · contrôles ss / nmap", "gris", 16)
rp = a.boite(900, 560, 380, 110, "Reverse proxy HTTPS (prévu)\npour un futur accès web\nport applicatif jamais exposé", "blanc", 16, "dashed", "#868e96")
jeux = a.boite(40, 580, 300, 110, "Jeux fictifs du lab\n3 magasins x 2 mois\nLyon : 4 produits", "gris", 16)
web = a.boite(40, 790, 300, 100, "Version web (GitHub Pages)\nmêmes chiffres, recalculés", "vert", 16)
a.fleche(user, tg, "messages")
a.fleche(tg, gw, "HTTPS sortant (polling)", vertical=True)
a.fleche(gw, ag, "tâche")
a.fleche(ag, ia, "HTTPS sortant")
a.fleche(mini, gw, "sélection")
a.fleche(jeux, mini, "jeu servi", montant=True)
a.fleche(jeux, web, "construire_donnees.py", vertical=True)
a.ecrire("architecture")
print("ok")
