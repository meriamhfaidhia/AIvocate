from pymongo import MongoClient
from fastapi import FastAPI, HTTPException, status,UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from upload import extract_text_from_pdf, detect_contract_structure, analyze_contract_content, generate_detailed_explanations, calculate_contract_score
import shutil
import os
import tempfile
from fastapi.responses import JSONResponse
from rag import (
    load_documents,
    preprocess_documents,
    split_documents,
    build_retrievers,
    HybridRetriever,
    rag_chain_hybrid
)
from analyse import analyse_boite_mail_pieces_jointes_juridiques
from typing import List

# Connexion MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["aivocate-db"]
users_collection = db["Utilisateurs"]
users_collection.create_index("email", unique=True)



# Créer FastAPI app
app = FastAPI()
# Autoriser le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔍 Chargement des PDF...")
docs = load_documents("data/")
docs = preprocess_documents(docs)
docs = split_documents(docs)

print("⚖️ Construction des retrievers...")
bm25, faiss = build_retrievers(docs)
retriever = HybridRetriever(bm25=bm25, faiss=faiss)

# Modèle Pydantic pour les utilisateurs
class Utilisateur(BaseModel):
    email: EmailStr
    mot_de_passe: str


class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    answer: str
    links: List[str]

@app.post("/ask", response_model=AnswerResponse)
def ask_question(req: QuestionRequest):
    """
    Reçoit une question et renvoie la réponse + les liens.
    """
    raw_response = rag_chain_hybrid(req.question, retriever)

    # On parse la réponse brute de rag_chain_hybrid
    parts = raw_response.split("🌐 Sources Google :")
    answer = parts[0].replace("📖 Selon le contexte :", "").strip()
    urls = []
    if len(parts) > 1:
        try:
            urls = eval(parts[1].strip())  # transforme ['url1','url2'] en liste
        except Exception:
            urls = []

    return AnswerResponse(answer=answer, links=urls)

@app.post("/login")
def login(utilisateur: Utilisateur):
    user = users_collection.find_one({"email": utilisateur.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    if utilisateur.mot_de_passe != user.get("mot_de_passe"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    return {"message": "Connexion réussie", "email": utilisateur.email}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Analyse un fichier PDF de contrat et retourne un rapport détaillé
    """
    # Vérification que le fichier est un PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF")
    
    try:
        # Création d'un fichier temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            # Lecture et écriture du fichier uploadé
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Extraction du texte
        extracted_text = extract_text_from_pdf(temp_path)
        
        if extracted_text.startswith("Erreur"):
            raise HTTPException(status_code=500, detail=extracted_text)
        
        # Analyses
        structure = detect_contract_structure(extracted_text)
        content_analysis = analyze_contract_content(extracted_text)
        explanations = generate_detailed_explanations(extracted_text)
        score = calculate_contract_score(content_analysis)
        
        # Nettoyage du fichier temporaire
        os.unlink(temp_path)
        
        # Construction de la réponse
        response = {
            "filename": file.filename,
            "file_size": len(content),
            "text_length": len(extracted_text),
            "analysis": {
                "contract_type": content_analysis["type_contrat"],
                "parties": content_analysis["parties"],
                "financial": {
                    "amount": content_analysis["montant"],
                    "duration": content_analysis["duree"]
                },
                "provider_commitments": content_analysis["engagement_prestataire"],
                "risk_clauses": content_analysis["clauses_risque"],
                "missing_elements": content_analysis["elements_manquants"],
                "detailed_explanations": explanations,
                "contract_score": score,
                "recommendation": get_recommendation(score)
            },
            "structure_detected": structure
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        # Nettoyage en cas d'erreur
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

def get_recommendation(score: int) -> str:
    """Retourne une recommandation basée sur le score"""
    if score >= 80:
        return "CONTRAT ÉQUILIBRÉ - Signature recommandée"
    elif score >= 60:
        return "CONTRAT MOYEN - Quelques négociations nécessaires"
    else:
        return "CONTRAT DÉSÉQUILIBRÉ - Révision approfondie requise"
    

@app.get("/analyse-mails")
def analyse_mails():
    """
    Lance l’analyse des mails et retourne les résultats
    """
    resultats = analyse_boite_mail_pieces_jointes_juridiques()
    return resultats
    

