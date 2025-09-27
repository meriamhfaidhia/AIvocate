# ==============================
# ANALYSEUR DE CONTRATS - VERSION RENFORCÉE
# ==============================
from transformers import pipeline
import pdfplumber
import re
from datetime import datetime
import langdetect
from collections import Counter

# === CONFIGURATION ===
try:
    summarizer = pipeline("summarization", model="csebuetnlp/mT5_multilingual_XLSum")
except:
    summarizer = None

# === FONCTIONS D'EXTRACTION AMÉLIORÉES ===

def extract_text_from_pdf(file_path):
    """Extrait le texte avec meilleure gestion de la structure"""
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    # Nettoyage du texte
                    page_text = re.sub(r'\n+', '\n', page_text)  # Supprime les sauts de ligne multiples
                    page_text = re.sub(r' +', ' ', page_text)    # Supprime les espaces multiples
                    full_text += f"\n--- Page {page_num+1} ---\n{page_text}"
        return full_text.strip()
    except Exception as e:
        return f"Erreur lors de l'extraction: {str(e)}"

def detect_contract_structure(text):
    """Détection améliorée de la structure du contrat"""
    structure = {
        "entete": "",
        "parties": "",
        "objet": "", 
        "engagements": "",
        "financier": "",
        "propriete_intellectuelle": "",
        "confidentialite": "",
        "duree": "",
        "resiliation": "",
        "divers": ""
    }
    
    # Détection par motifs contextuels plutôt que par titres formels
    lines = text.split('\n')
    current_section = "entete"
    section_content = []
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Détection des sections par contenu
        lower_line = line_clean.lower()
        
        if re.search(r'entre les soussignés|entre.*et|contractant', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "parties"
            section_content = [line_clean]
            
        elif re.search(r'objet|mission|prestation', lower_line) and len(line_clean) < 100:
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "objet"
            section_content = [line_clean]
            
        elif re.search(r's\'engage à|obligation|devoir', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "engagements"
            section_content = [line_clean]
            
        elif re.search(r'euros?|€|prix|rémunération', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "financier"
            section_content = [line_clean]
            
        elif re.search(r'propriété intellectuelle|droits d\'auteur', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "propriete_intellectuelle"
            section_content = [line_clean]
            
        elif re.search(r'confidentialité|secret', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "confidentialite"
            section_content = [line_clean]
            
        elif re.search(r'durée|période|termes?', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "duree"
            section_content = [line_clean]
            
        elif re.search(r'résiliation|fin.*contrat', lower_line):
            if section_content and current_section in structure:
                structure[current_section] = ' '.join(section_content)
            current_section = "resiliation"
            section_content = [line_clean]
            
        else:
            section_content.append(line_clean)
    
    # Dernière section
    if section_content and current_section in structure:
        structure[current_section] = ' '.join(section_content)
    
    return structure

# === ANALYSE DE CONTENU RENFORCÉE ===

def analyze_contract_content(text):
    """Analyse approfondie du contenu du contrat"""
    analysis = {
        "type_contrat": "Indéterminé",
        "parties": {"client": "Non spécifié", "prestataire": "Non spécifié"},
        "montant": "Non spécifié",
        "duree": "Non spécifiée",
        "engagement_prestataire": [],
        "engagement_client": [],
        "clauses_risque": [],
        "elements_manquants": []
    }
    
    # Détection du type de contrat par analyse sémantique
    if re.search(r'ambassadeur|influenceur|marque', text.lower()):
        analysis["type_contrat"] = "CONTRAT D'AMBASSADEUR"
    elif re.search(r'freelance|prestataire indépendant', text.lower()):
        analysis["type_contrat"] = "CONTRAT FREELANCE"
    elif re.search(r'consultant|conseil', text.lower()):
        analysis["type_contrat"] = "CONTRAT DE CONSULTANCE"
    
    # Extraction des parties
    parties_match = re.search(r'Entre.*?\n(.*?)\n(.*?)\n', text, re.IGNORECASE | re.DOTALL)
    if parties_match:
        parties_lines = parties_match.groups()
        if len(parties_lines) >= 2:
            analysis["parties"]["prestataire"] = parties_lines[0].strip()
            analysis["parties"]["client"] = parties_lines[1].strip()
    
    # Extraction du montant
    montant_match = re.search(r'(\d+[,\d]*)\s*[€\$£]|euros?', text, re.IGNORECASE)
    if montant_match:
        analysis["montant"] = montant_match.group(0)
    
    # Extraction de la durée
    duree_match = re.search(r'durée de.*?(\d+)\s*(?:jours|mois|ans)', text.lower())
    if duree_match:
        analysis["duree"] = f"{duree_match.group(1)} {duree_match.group(2)}"
    
    # Analyse des engagements
    engagements = re.findall(r'([^.]*?s\'engage à[^.]*\.)', text, re.IGNORECASE)
    analysis["engagement_prestataire"] = engagements[:5]  # Limite à 5 engagements
    
    # Détection des clauses à risque
    clauses_risque = detect_risk_clauses_improved(text)
    analysis["clauses_risque"] = clauses_risque
    
    # Vérification des éléments manquants
    analysis["elements_manquants"] = check_missing_elements(text)
    
    return analysis

def detect_risk_clauses_improved(text):
    """Détection améliorée des clauses à risque"""
    risques = []
    
    # 1. Délais de paiement excessifs
    if re.search(r'(\d+)\s*jours.*paiement', text.lower()):
        match = re.search(r'(\d+)\s*jours.*paiement', text.lower())
        jours = int(match.group(1)) if match else 0
        if jours > 45:
            risques.append(f"🚨 Délai de paiement excessif: {jours} jours (limite légale: 45 jours)")
    
    # 2. Propriété intellectuelle trop large
    if re.search(r'cession.*tous.*droits|propriété.*intellectuelle.*client', text.lower()):
        risques.append("⚠️  Cession extensive des droits de propriété intellectuelle")
    
    # 3. Confidentialité perpétuelle
    if re.search(r'confidentialité.*illimitée|permanent', text.lower()):
        risques.append("🔒 Clause de confidentialité potentiellement excessive")
    
    # 4. Résiliation unilatérale déséquilibrée
    if re.search(r'résiliation.*unilatérale.*client', text.lower()) and not re.search(r'résiliation.*unilatérale.*prestataire', text.lower()):
        risques.append("⚖️ Résiliation unilatérale déséquilibrée")
    
    # 5. Pénalités disproportionnées
    penalite_match = re.search(r'pénalité.*(\d+)%', text.lower())
    if penalite_match and int(penalite_match.group(1)) > 10:
        risques.append(f"💰 Pénalités potentiellement excessives: {penalite_match.group(1)}%")
    
    # 6. Obligations imprécises
    obligations_imprecises = [
        "raisonnable", "usages", "best efforts", "meilleures pratiques"
    ]
    for obligation in obligations_imprecises:
        if re.search(obligation, text.lower()):
            risques.append(f"🎯 Terme imprécis détecté: '{obligation}'")
            break
    
    return risques

def check_missing_elements(text):
    """Vérifie les éléments essentiels manquants"""
    elements_manquants = []
    
    elements_essentiels = {
        "montant": r'montant|prix|rémunération|€',
        "duree": r'durée|période|termes?',
        "livrables": r'livrable|prestation|mission',
        "paiement": r'paiement|facturation',
        "propriete_intellectuelle": r'propriété intellectuelle|droits',
        "confidentialite": r'confidentialité|secret',
        "resiliation": r'résiliation|fin'
    }
    
    for element, pattern in elements_essentiels.items():
        if not re.search(pattern, text.lower()):
            elements_manquants.append(element)
    
    return elements_manquants

def generate_detailed_explanations(text):
    """Génère des explications détaillées des clauses"""
    explanations = []
    
    # Détection des clauses complexes avec contexte
    clause_patterns = {
        r's\'engage à.*exclusivité': {
            'titre': "Clause d'exclusivité",
            'explication': "📌 Vous vous engagez à ne pas travailler avec des concurrents",
            'risque': "Limitation de votre activité professionnelle"
        },
        r'propriété intellectuelle.*client': {
            'titre': "Propriété intellectuelle",
            'explication': "🎨 Les créations appartiennent au client après paiement",
            'risque': "Perte des droits sur vos créations"
        },
        r'confidentialité.*illimitée': {
            'titre': "Confidentialité étendue",
            'explication': "🤫 Obligation de secret même après la fin du contrat",
            'risque': "Engagement à long terme potentiellement contraignant"
        },
        r'résiliation.*unilatérale': {
            'titre': "Résiliation unilatérale",
            'explication': "⚡ Une seule partie peut mettre fin au contrat",
            'risque': "Manque de protection en cas de rupture"
        }
    }
    
    for pattern, info in clause_patterns.items():
        if re.search(pattern, text.lower()):
            explanations.append(info)
    
    return explanations

# === RAPPORT AMÉLIORÉ ===

def generate_enhanced_report(extracted_text, pdf_path):
    """Génère un rapport d'analyse amélioré"""
    
    print("\n" + "="*80)
    print("🔍 RAPPORT D'ANALYSE CONTRACTUELLE DÉTAILLÉ")
    print("="*80)
    
    # Analyses
    structure = detect_contract_structure(extracted_text)
    content_analysis = analyze_contract_content(extracted_text)
    explanations = generate_detailed_explanations(extracted_text)
    
    print(f"\n📊 INFORMATIONS GÉNÉRALES")
    print("-" * 40)
    print(f"- Fichier analysé : {pdf_path}")
    print(f"- Date d'analyse : {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"- Type de contrat : {content_analysis['type_contrat']}")
    print(f"- Taille du texte : {len(extracted_text)} caractères")
    
    print(f"\n👥 PARTIES CONTRACTANTES")
    print("-" * 40)
    print(f"- Prestataire : {content_analysis['parties']['prestataire']}")
    print(f"- Client : {content_analysis['parties']['client']}")
    
    print(f"\n💰 ASPECTS FINANCIERS")
    print("-" * 40)
    print(f"- Montant : {content_analysis['montant']}")
    print(f"- Durée : {content_analysis['duree']}")
    
    print(f"\n📝 ENGAGEMENTS DU PRESTATAIRE")
    print("-" * 40)
    if content_analysis['engagement_prestataire']:
        for i, engagement in enumerate(content_analysis['engagement_prestataire'][:3], 1):
            print(f"{i}. {engagement.strip()}")
    else:
        print("Aucun engagement spécifique détecté")
    
    print(f"\n⚠️  CLAUSES À ATTENTION")
    print("-" * 40)
    if content_analysis['clauses_risque']:
        for risque in content_analysis['clauses_risque']:
            print(f"- {risque}")
    else:
        print("✅ Aucune clause à risque majeur détectée")
    
    print(f"\n🔍 EXPLICATIONS DÉTAILLÉES")
    print("-" * 40)
    if explanations:
        for i, explication in enumerate(explanations, 1):
            print(f"\n{i}. {explication['titre']}")
            print(f"   📖 {explication['explication']}")
            print(f"   ⚠️  Risque: {explication['risque']}")
    else:
        print("Aucune clause complexe nécessitant une explication détaillée")
    
    print(f"\n✅ ÉLÉMENTS VÉRIFIÉS")
    print("-" * 40)
    elements_presents = [elem for elem in [
        "montant", "duree", "livrables", "paiement", 
        "propriete_intellectuelle", "confidentialite", "resiliation"
    ] if elem not in content_analysis['elements_manquants']]
    
    for element in elements_presents:
        print(f"✓ {element.replace('_', ' ').title()}")
    
    if content_analysis['elements_manquants']:
        print(f"\n❌ ÉLÉMENTS MANQUANTS À NÉGOCIER")
        print("-" * 40)
        for element in content_analysis['elements_manquants']:
            print(f"- {element.replace('_', ' ').title()}")
    
    # Score final
    score = calculate_contract_score(content_analysis)
    print(f"\n🎯 SCORE FINAL DU CONTRAT: {score}/100")
    
    if score >= 80:
        print("✅ CONTRAT ÉQUILIBRÉ - Signature recommandée")
    elif score >= 60:
        print("⚠️  CONTRAT MOYEN - Quelques négociations nécessaires")
    else:
        print("🚨 CONTRAT DÉSÉQUILIBRÉ - Révision approfondie requise")

def calculate_contract_score(analysis):
    """Calcule un score de qualité du contrat"""
    score = 100
    
    # Pénalités pour éléments manquants
    score -= len(analysis['elements_manquants']) * 10
    
    # Pénalités pour clauses à risque
    score -= len(analysis['clauses_risque']) * 5
    
    # Bonus pour contrat bien structuré
    if analysis['montant'] != "Non spécifié":
        score += 10
    if analysis['duree'] != "Non spécifiée":
        score += 10
    
    return max(0, min(100, score))

# === POINT D'ENTRÉE PRINCIPAL ===

def main():
    """Fonction principale d'analyse"""
    pdf_path = "cc.pdf"
    
    print("🔍 ANALYSE CONTRACTUELLE APPROFONDIE EN COURS...")
    extracted_text = extract_text_from_pdf(pdf_path)
    
    if extracted_text.startswith("Erreur"):
        print(f"❌ {extracted_text}")
        return
    
    # Affichage d'un extrait pour contexte
    print(f"\n📄 EXTRAIT DU CONTRAT (500 premiers caractères):")
    print("-" * 50)
    print(extracted_text[:500] + "...\n")
    
    # Génération du rapport détaillé
    generate_enhanced_report(extracted_text, pdf_path)
    
    print(f"\n💡 CONSEILS PRATIQUES")
    print("-" * 50)
    print("• Demandez toujours un avenant pour les modifications")
    print("• Conservez toutes les communications écrites")
    print("• Vérifiez les délais de paiement (max 45 jours)")
    print("• Négociez une clause de propriété intellectuelle équilibrée")

if __name__ == "__main__":
    main()