"""
Scrape emails via IMAP -> FILTRAGE STRICT (pièces jointes juridiques seulement) -> analyse ton juridique -> analyse clause-par-clause et heatmap.
Dependencies:
pip install transformers torch matplotlib beautifulsoup4 python-dotenv PyPDF2
"""

import imaplib
import email
from email.header import decode_header
import html
from bs4 import BeautifulSoup
import re
import os
import csv
import io
from typing import List, Tuple, Dict
import PyPDF2
import matplotlib.pyplot as plt

# Transformers
from transformers import pipeline

# ---------------------------
# CONFIG - à personnaliser
# ---------------------------
IMAP_HOST = "imap.gmail.com"
IMAP_USER = "meriamhfaidhia@gmail.com"
IMAP_PASS = "ruid vyly nhpv uhlc"
MAILBOX = "INBOX"
FETCH_LIMIT = 100

# ---------------------------
# Mots-clés pour filtrer les PIÈCES JOINTES JURIDIQUES
# ---------------------------
MOTS_CLES_PIECES_JOINTES_JURIDIQUES = [
    # Contrats et conventions
    'contrat', 'convention', 'accord', 'protocole', 'avenant', 'addendum',
    'bail', 'location', 'prestation', 'service', 'engagement',
    
    # Documents juridiques
    'juridique', 'legal', 'clause', 'article', 'disposition',
    'litige', 'contentieux', 'assignation', 'ordonnance', 'jugement',
    'sentence', 'arbitrage', 'médiation', 'conciliation',
    
    # Types de documents spécifiques
    'consultation', 'avis', 'memorandum', 'recommandation', 'opinion',
    'mémorandum', 'protocol', 'règlement', 'règlementation',
    
    # Termes techniques juridiques
    'résiliation', 'pénalité', 'astreinte', 'dommages', 'intérêts',
    'indemnité', 'garantie', 'caution', 'obligation', 'responsabilité'
]

EXTENSIONS_DOCUMENTS = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf']

# ---------------------------
# Modèle sentiment
# ---------------------------
sentiment_pipeline = pipeline("sentiment-analysis", model="tblard/tf-allocine", device=-1)

# ---------------------------
# UTIL: nettoyage HTML -> texte
# ---------------------------
def html_to_text(html_content: str) -> str:
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    [s.extract() for s in soup(["script", "style", "head", "meta", "link"])]
    text = soup.get_text(separator="\n")
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    text = html.unescape(text)
    return text.strip()

# ---------------------------
# FILTRAGE STRICT : uniquement emails avec pièces jointes juridiques
# ---------------------------
def est_piece_jointe_juridique(nom_fichier: str) -> Tuple[bool, str]:
    """
    Détermine si une pièce jointe est juridique
    Retourne: (est_juridique, raison)
    """
    if not nom_fichier:
        return False, "Nom de fichier vide"
    
    nom_lower = nom_fichier.lower()
    
    # Vérifier l'extension d'abord
    extension_valide = any(nom_lower.endswith(ext) for ext in EXTENSIONS_DOCUMENTS)
    if not extension_valide:
        return False, f"Extension non document: {nom_fichier}"
    
    # Vérifier les mots-clés juridiques dans le nom du fichier
    mots_trouves = []
    for mot in MOTS_CLES_PIECES_JOINTES_JURIDIQUES:
        if mot in nom_lower:
            mots_trouves.append(mot)
    
    if mots_trouves:
        return True, f"Pièce jointe juridique: {', '.join(mots_trouves[:3])} dans '{nom_fichier}'"
    
    # Vérifier les patterns communs de documents juridiques
    patterns_juridiques = [
        r'contrat_.*', r'convention_.*', r'accord_.*', r'bail_.*',
        r'avis_juridique.*', r'consultation_.*', r'clause_.*',
        r'addendum_.*', r'avenant_.*', r'protocole_.*'
    ]
    
    for pattern in patterns_juridiques:
        if re.search(pattern, nom_lower):
            return True, f"Pattern juridique détecté: {pattern}"
    
    return False, f"Pièce jointe non juridique: {nom_fichier}"

def filtrer_emails_avec_pieces_jointes_juridiques(emails: List[Dict]) -> List[Dict]:
    """
    Filtre strictement : ne garde que les emails avec au moins une pièce jointe juridique
    """
    emails_filtres = []
    
    for email_data in emails:
        pieces_jointes_juridiques = []
        raisons = []
        
        # Analyser chaque pièce jointe
        for piece in email_data.get("attachments", []):
            nom_fichier = piece[0] if piece[0] else ""
            est_juridique, raison = est_piece_jointe_juridique(nom_fichier)
            
            if est_juridique:
                pieces_jointes_juridiques.append({
                    'nom': nom_fichier,
                    'raison': raison,
                    'contenu': piece[1]  # payload
                })
                raisons.append(raison)
        
        # Si au moins une pièce jointe juridique, garder l'email
        if pieces_jointes_juridiques:
            email_data["pieces_jointes_juridiques"] = pieces_jointes_juridiques
            email_data["raison_filtrage"] = f"{len(pieces_jointes_juridiques)} pièce(s) jointe(s) juridique(s) identifiée(s)"
            email_data["raisons_detaillees"] = raisons
            emails_filtres.append(email_data)
    
    return emails_filtres

# ---------------------------
# CONNEXION IMAP & RÉCUP EMAILS (optimisée pour pièces jointes)
# ---------------------------
def fetch_emails(imap_host: str, user: str, password: str, mailbox: str = "INBOX", limit: int = 100):
    mail = imaplib.IMAP4_SSL(imap_host)
    mail.login(user, password)
    mail.select(mailbox)
    
    # Chercher les emails récents
    typ, data = mail.search(None, "ALL")
    ids = data[0].split()
    ids = ids[-limit:]
    
    emails = []
    for eid in reversed(ids):
        try:
            typ, msg_data = mail.fetch(eid, "(RFC822)")
            if typ != 'OK':
                continue
            
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)
            subject = decode_mime_words(msg.get("Subject", ""))
            from_ = decode_mime_words(msg.get("From", ""))
            date = msg.get("Date", "")
            
            body_text = ""
            attachments = []
            pdf_texts = []
            
            if msg.is_multipart():
                for part in msg.walk():
                    ctype = part.get_content_type()
                    cdisp = str(part.get("Content-Disposition"))
                    
                    # Extraire le texte du corps
                    if ctype == "text/plain" and "attachment" not in cdisp:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_text += payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                    elif ctype == "text/html" and "attachment" not in cdisp and not body_text:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_text = payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                    
                    # Gérer les pièces jointes (TOUTES les pièces jointes)
                    elif "attachment" in cdisp.lower() or part.get_filename():
                        fname = part.get_filename()
                        payload = part.get_payload(decode=True)
                        attachments.append((fname, payload, ctype))
                        
                        # Extraire le texte des PDFs pour analyse
                        if fname and fname.lower().endswith(".pdf"):
                            try:
                                reader = PyPDF2.PdfReader(io.BytesIO(payload))
                                text_pages = []
                                for p in reader.pages:
                                    try:
                                        text_pages.append(p.extract_text() or "")
                                    except Exception:
                                        continue
                                pdf_text = "\n".join(text_pages)
                                pdf_texts.append((fname, pdf_text))
                            except Exception as e:
                                print(f"⚠️ Erreur extraction PDF {fname}: {e}")
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body_text = payload.decode(msg.get_content_charset() or "utf-8", errors="ignore")

            # Convertir HTML en texte si nécessaire
            if body_text and "<html" in body_text[:200].lower():
                body_text = html_to_text(body_text)

            emails.append({
                "subject": subject,
                "from": from_,
                "date": date,
                "body": body_text or "",
                "attachments": attachments,
                "pdf_texts": pdf_texts,
                "id": eid.decode() if isinstance(eid, bytes) else str(eid),
                "total_pieces_jointes": len(attachments)
            })
            
        except Exception as e:
            print(f"Erreur traitement email {eid}: {e}")
            continue
    
    mail.logout()
    return emails

def decode_mime_words(s):
    try:
        decoded_fragments = decode_header(s)
        decoded = ""
        for frag, enc in decoded_fragments:
            if isinstance(frag, bytes):
                decoded += frag.decode(enc or "utf-8", errors="ignore")
            else:
                decoded += frag
        return decoded
    except Exception:
        return s

# ---------------------------
# ANALYSE TON JURIDIQUE
# ---------------------------
def analyse_ton_juridique(text: str) -> Tuple[str, float, Dict]:
    """Analyse du ton juridique"""
    if not text or text.strip() == "":
        return ("Ton ambigu ❔", 0.0, {})
    
    try:
        segments = text.split('.')[:5]
        scores = []
        
        for segment in segments:
            if len(segment.strip()) > 20:
                try:
                    r = sentiment_pipeline(segment[:200])[0]
                    label = r["label"].lower()
                    score = float(r["score"])
                    
                    if "negative" in label:
                        scores.append(score)
                    else:
                        scores.append(1 - score)
                except Exception:
                    continue
        
        if scores:
            score_moyen = sum(scores) / len(scores)
        else:
            score_moyen = 0.5
        
        if score_moyen > 0.7:
            return ("Ton menaçant ⚠", score_moyen, {"segments_analyses": len(scores)})
        elif score_moyen > 0.4:
            return ("Ton ambigu ❔", score_moyen, {"segments_analyses": len(scores)})
        else:
            return ("Ton conciliant ✅", score_moyen, {"segments_analyses": len(scores)})
            
    except Exception as e:
        return ("Ton ambigu ❔", 0.0, {"erreur": str(e)})

# ---------------------------
# ANALYSE DES CLAUSES (optimisée pour documents juridiques)
# ---------------------------
KEYWORDS_RISK = {
    "pénalité": 1.0, "pénalités": 1.0, "astreinte": 1.0, "résiliation": 0.9,
    "sanction": 1.0, "saisir": 1.0, "tribunal": 1.0, "amende": 1.0,
    "dommages": 0.9, "indemnité": 0.8, "unilatéral": 0.8, "forfaitaire": 0.7,
    "forclusion": 0.9, "nullité": 0.8, "irrévocable": 0.7, "exclusivité": 0.6
}

def split_into_clauses(text: str) -> List[str]:
    """Version améliorée pour documents juridiques structurés"""
    if not text:
        return []
    
    clauses = []
    
    # D'abord essayer de split par articles (format juridique standard)
    articles = re.split(r'(?i)(Article\s+\d+[\.\:\-\s])', text)
    if len(articles) > 1:
        for i in range(1, len(articles), 2):
            if i+1 < len(articles):
                clause = articles[i] + articles[i+1]
                clauses.append(clause.strip())
    else:
        # Sinon, split par paragraphes
        paragraphs = re.split(r'\n\s*\n+', text)
        for p in paragraphs:
            p = p.strip()
            if p and len(p) > 10:
                # Split par phrases si le paragraphe est long
                if len(p) > 200:
                    sentences = re.split(r'[\.\?!;]\s+', p)
                    for s in sentences:
                        s = s.strip()
                        if len(s) > 20:
                            clauses.append(s)
                else:
                    clauses.append(p)
    
    return clauses[:100]  # Limiter pour éviter l'explosion

def score_clause(clause: str) -> float:
    text = clause.lower()
    kw_score = 0.0
    for kw, w in KEYWORDS_RISK.items():
        if kw in text:
            kw_score += w
    kw_score = min(kw_score / 3.0, 1.0)
    
    try:
        r = sentiment_pipeline(text[:512])[0]
        label = r["label"].lower()
        s = float(r["score"])
        neg = s if "negative" in label else 1.0 - s
    except Exception:
        neg = 0.5
    
    final = 0.6 * kw_score + 0.4 * neg  # Poids plus important aux mots-clés juridiques
    return max(0.0, min(1.0, final))

def generer_heatmap_clauses(clauses: List[str], scores: List[float], titre="Analyse des clauses"):
    if not clauses:
        print("Aucune clause à analyser")
        return
        
    couleurs = []
    for s in scores:
        if s < 0.33:
            couleurs.append("green")
        elif s < 0.66:
            couleurs.append("orange")
        else:
            couleurs.append("red")

    fig, ax = plt.subplots(figsize=(14, max(8, len(clauses)*0.7)))
    y_pos = list(range(len(clauses)))
    bars = ax.barh(y_pos, [1]*len(clauses), color=couleurs, alpha=0.8)
    ax.set_yticks(y_pos)
    
    # Labels optimisés pour clauses juridiques
    labels = []
    for c in clauses:
        # Pour les clauses juridiques, essayer de garder l'essentiel
        if len(c) > 100:
            # Chercher un point de coupure naturel
            if ' - ' in c[:100]:
                short = c[:c[:100].rfind(' - ')] + "..."
            elif '. ' in c[:80]:
                short = c[:c[:80].rfind('. ')+1] + "..."
            else:
                short = c[:97] + "..."
            labels.append(short)
        else:
            labels.append(c)
    
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlim(0, 1)
    ax.set_xticks([])
    ax.set_title(titre, fontsize=16, pad=20, fontweight='bold')
    
    # Ajouter les scores
    for i, (s, bar) in enumerate(zip(scores, bars)):
        color = 'white' if s > 0.5 else 'black'
        ax.text(0.5, i, f"{s:.2f}", va='center', ha='center', 
                color=color, fontweight='bold', fontsize=9)
    
    # Légende détaillée
    legend_elements = [
        plt.Rectangle((0,0),1,1, fc="green", alpha=0.8, label="✅ Faible risque (0-0.33)"),
        plt.Rectangle((0,0),1,1, fc="orange", alpha=0.8, label="⚠️ Risque modéré (0.33-0.66)"),
        plt.Rectangle((0,0),1,1, fc="red", alpha=0.8, label="❌ Risque élevé (0.66-1.0)")
    ]
    ax.legend(handles=legend_elements, loc='lower right', fontsize=10)
    
    plt.tight_layout()
    plt.show()

# ---------------------------
# WORKFLOW PRINCIPAL STRICT
# ---------------------------
def analyse_boite_mail_pieces_jointes_juridiques():
    print("🔍 Récupération des emails...")
    emails = fetch_emails(IMAP_HOST, IMAP_USER, IMAP_PASS, MAILBOX, FETCH_LIMIT)
    print(f"→ {len(emails)} emails récupérés au total")
    print(f"→ {sum(e['total_pieces_jointes'] for e in emails)} pièces jointes totales détectées")
    
    # FILTRAGE STRICT : uniquement emails avec pièces jointes juridiques
    print("\n🔎 Filtrage STRICT : emails avec pièces jointes juridiques...")
    emails_filtres = filtrer_emails_avec_pieces_jointes_juridiques(emails)
    print(f"→ {len(emails_filtres)} emails avec pièces jointes juridiques identifiés")
    
    if not emails_filtres:
        print("❌ Aucun email avec pièce jointe juridique trouvé")
        print("💡 Conseil : Vérifiez que vos documents ont des noms contenant des termes juridiques")
        return
    
    rows = []
    for i, email_data in enumerate(emails_filtres, 1):
        print(f"\n{'='*80}")
        print(f"📧 ANALYSE {i}/{len(emails_filtres)}")
        print(f"{'='*80}")
        print(f"Sujet: {email_data['subject']}")
        print(f"Expéditeur: {email_data['from']}")
        print(f"Date: {email_data['date']}")
        print(f"Raison: {email_data.get('raison_filtrage', 'N/A')}")
        
        # Analyser le ton de l'email
        tone_label, tone_score, details_ton = analyse_ton_juridique(email_data["body"])
        print(f"📊 Ton de l'email: {tone_label} (score: {tone_score:.2f})")
        
        # Analyser CHAQUE pièce jointe juridique
        for pj in email_data.get("pieces_jointes_juridiques", []):
            print(f"\n📄 DOCUMENT: {pj['nom']}")
            print(f"   Raison: {pj['raison']}")
            
            # Extraire le texte si c'est un PDF
            if pj['nom'].lower().endswith('.pdf'):
                try:
                    reader = PyPDF2.PdfReader(io.BytesIO(pj['contenu']))
                    text_pages = []
                    for p in reader.pages:
                        try:
                            text_pages.append(p.extract_text() or "")
                        except Exception:
                            continue
                    pdf_text = "\n".join(text_pages)
                    
                    clauses = split_into_clauses(pdf_text)
                    scores = [score_clause(c) for c in clauses]
                    
                    if clauses:
                        print(f"   → {len(clauses)} clauses analysées")
                        
                        # Top 3 des clauses risquées
                        clauses_scores = list(zip(clauses, scores))
                        clauses_scores.sort(key=lambda x: x[1], reverse=True)
                        
                        print("   🔴 Top 3 clauses à risque:")
                        for j, (clause, score) in enumerate(clauses_scores[:3], 1):
                            niveau = "❌ ÉLEVÉ" if score > 0.66 else "⚠️ MODÉRÉ" if score > 0.33 else "✅ FAIBLE"
                            print(f"      {j}. [{niveau} - {score:.2f}] {clause[:80]}...")
                        
                        # Générer la heatmap
                        generer_heatmap_clauses(clauses, scores, 
                                              titre=f"Heatmap - {pj['nom']}\n{email_data['subject'][:50]}...")
                    else:
                        print("   → Aucune clause identifiable trouvée")
                        
                except Exception as e:
                    print(f"   ❌ Erreur analyse PDF: {e}")
        
        # Sauvegarder les données pour le CSV
        rows.append({
            "sujet": email_data["subject"],
            "expediteur": email_data["from"],
            "date": email_data["date"],
            "ton_email": tone_label,
            "score_ton": f"{tone_score:.3f}",
            "pieces_jointes_juridiques": len(email_data.get("pieces_jointes_juridiques", [])),
            "noms_pieces_jointes": "; ".join([pj['nom'] for pj in email_data.get("pieces_jointes_juridiques", [])]),
            "raison_filtrage": email_data.get("raison_filtrage", "")
        })
    
    # Sauvegarder le rapport final
    if rows:
        filename = "analyse_emails_pieces_jointes_juridiques.csv"
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"\n{'='*80}")
        print(f"✅ RAPPORT FINAL")
        print(f"{'='*80}")
        print(f"📊 {len(rows)} emails avec pièces jointes juridiques analysés")
        print(f"💾 Rapport sauvegardé: {filename}")
        
        # Statistiques
        total_pieces_jointes = sum(len(e.get("pieces_jointes_juridiques", [])) for e in emails_filtres)
        print(f"📎 Total pièces jointes juridiques analysées: {total_pieces_jointes}")
        
    else:
        print("❌ Aucune donnée à sauvegarder")

if __name__ == "__main__":
    analyse_boite_mail_pieces_jointes_juridiques()