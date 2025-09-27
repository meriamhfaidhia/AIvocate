# 📜 AIvocate – Analyse Automatique de Contrats & Emails Juridiques  

> **Audit juridique intelligent** : extraction, analyse, scoring et visualisation des risques contractuels et des échanges email.  

---

## 🚀 Présentation  

AIvocate est un pipeline complet qui combine **extraction automatique**, **analyse juridique avancée** et **recherche d’informations externes** pour aider les juristes, freelances et entreprises à :  

- 📂 **Analyser des contrats PDF** en profondeur  
- ✉️ **Traiter automatiquement les emails juridiques** et leurs pièces jointes  
- 🔎 **Repérer les clauses sensibles** et évaluer les risques  
- 🌐 **Enrichir les réponses** avec des recherches web (Google + SerpAPI)  
- 📊 **Générer un rapport clair**, structuré et noté sur 100  

---

## 🧠 Fonctionnalités principales  

### 🔹 Analyse automatique d’un contrat PDF  

- 📑 **Extraction du texte** avec `pdfplumber` et nettoyage intelligent  
- 🗂 **Détection de la structure du contrat** (en-tête, parties, objet, engagements, clauses financières, propriété intellectuelle, confidentialité, durée, résiliation…)  
- 📝 **Analyse de contenu** :  
  - Type de contrat (freelance, consultance, ambassadeur…)  
  - Parties contractantes  
  - Montant et durée  
  - Engagements repérés dans le texte  
  - Clauses à risque (paiement tardif, cession trop large, résiliation unilatérale…)  
  - Éléments manquants à négocier (montant, durée, livrables…)  
- 🤝 **Explications détaillées** des clauses sensibles  

### 🔹 Chaîne RAG Hybride (Retrieval-Augmented Generation)  

- 📂 **Chargement des PDF locaux** (`PyPDFLoader` + `DirectoryLoader`)  
- ✂️ **Chunking** en passages de 1200 caractères (chevauchement 200)  
- 🧮 **Indexation / Récupération** :  
  - `BM25Retriever` pour recherche lexicale  
  - `FAISS` + embeddings HuggingFace (`all-MiniLM-L6-v2`) pour recherche sémantique  
  - **HybridRetriever** personnalisé : combine BM25 + FAISS et conserve les 8 passages les plus pertinents  
- 🌐 **Recherche Web** : via `search_google_serpapi` + `requests` + `BeautifulSoup` pour enrichir le contexte avec Google  
- 🤖 **Réponse en français** : modèle `etalab-ia/camembert-base-squadFR-fquad-piaf` (pipeline question-answering)  

### 🔹 Analyse automatique des emails juridiques  

- 📬 **Récupération des emails récents**  
- 🧹 **Filtrage strict** : seules les pièces jointes “juridiques” sont analysées (PDF, DOC…)  
- 😐 **Analyse du ton juridique** du corps de l’email (conciliant, ambigu, menaçant)  
- 📜 **Analyse clause par clause** des documents attachés :  
  - Extraction du texte  
  - Découpage en clauses  
  - Évaluation du risque pour chaque clause  
  - Affichage des clauses les plus risquées  

---

## 🛠️ Technologies utilisées  

| Domaine            | Librairies / Techniques |
|--------------------|-------------------------|
| **Extraction PDF** | `pdfplumber`, `PyPDFLoader`, `DirectoryLoader` |
| **NLP & IA**       | `transformers`, `CamemBERT QA`, `all-MiniLM-L6-v2` |
| **Recherche hybride** | `BM25Retriever`, `FAISS`, HybridRetriever personnalisé |
| **Web Scraping**   | `requests`, `BeautifulSoup`, `SerpAPI` |
| **Emails**         | `imaplib`, `email` (filtrage + analyse PJ) |
| **Visualisation**  | `matplotlib` (heatmap), export CSV |
| **Utilitaires**    | `re`, `datetime`, `collections`, `langdetect` |

---

✨ **AIvocate** : l’assistant qui transforme vos contrats et emails juridiques en analyses claires et exploitables.  
