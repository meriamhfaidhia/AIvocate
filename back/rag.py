# ===========================
# Imports
# ===========================
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain.schema import Document, BaseRetriever
from pydantic import Field
from transformers import pipeline, AutoTokenizer, AutoModelForQuestionAnswering
from typing import List, Any
import re
import requests
from bs4 import BeautifulSoup
from serpapi import GoogleSearch

# ===========================
# Charger les PDF locaux
# ===========================
def load_documents(data_path="data/") -> List[Document]:
    loader = DirectoryLoader(data_path, glob="*.pdf", loader_cls=PyPDFLoader)
    docs = loader.load()
    return docs

# ===========================
# Nettoyage du texte
# ===========================
def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text

def preprocess_documents(docs: List[Document]) -> List[Document]:
    for doc in docs:
        doc.page_content = clean_text(doc.page_content)
    return docs

# ===========================
# Découpage en chunks
# ===========================
def split_documents(docs: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        length_function=len
    )
    return splitter.split_documents(docs)

# ===========================
# BM25 + FAISS retriever
# ===========================
def build_retrievers(docs: List[Document]):
    bm25 = BM25Retriever.from_documents(docs)
    bm25.k = 8

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(docs, embeddings)
    faiss_retriever = vectorstore.as_retriever(search_kwargs={"k": 8})

    return bm25, faiss_retriever

# ===========================
# Hybrid Retriever
# ===========================
class HybridRetriever(BaseRetriever):
    bm25: BM25Retriever = Field(...)
    faiss: Any = Field(...)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        bm25_docs = self.bm25.get_relevant_documents(query)
        faiss_docs = self.faiss.get_relevant_documents(query)
        all_docs = bm25_docs + faiss_docs

        # dédoublonnage
        seen, unique = set(), []
        for d in all_docs:
            if d.page_content not in seen:
                seen.add(d.page_content)
                unique.append(d)
        return unique[:8]

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        return self._get_relevant_documents(query)

# ===========================
# Formatage du contexte
# ===========================
def format_docs(docs: List[Document]) -> str:
    formatted = []
    for d in docs:
        content = d.page_content.strip()
        if len(content) > 1200:
            content = content[:1200] + "..."
        formatted.append(f"- {content}")
    return "\n".join(formatted)

# ===========================
# Recherche Google via SerpAPI
# ===========================
SERPAPI_KEY = ""  

def search_google_serpapi(query: str, num_results: int = 3):
    params = {
        "engine": "google",
        "q": query,
        "num": num_results,
        "hl": "fr",
        "api_key": SERPAPI_KEY
    }
    search = GoogleSearch(params)
    results = search.get_dict()
    urls = [r["link"] for r in results.get("organic_results", []) if "link" in r]
    return urls

def get_page_text(url: str) -> str:
    try:
        r = requests.get(url, timeout=5)
        soup = BeautifulSoup(r.text, "html.parser")
        text = soup.get_text(separator=" ", strip=True)
        return text
    except:
        return ""

# ===========================
# LLM - CamemBERT QA
# ===========================
model_name = "etalab-ia/camembert-base-squadFR-fquad-piaf"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForQuestionAnswering.from_pretrained(model_name)

qa_pipeline = pipeline(
    "question-answering",
    model=model,
    tokenizer=tokenizer
)

# ===========================
# Chaîne RAG PDF + Google
# ===========================
def rag_chain_hybrid(question: str, retriever: HybridRetriever) -> str:
    # 1️⃣ Contexte PDF
    pdf_docs = retriever.get_relevant_documents(question)
    context_pdf = format_docs(pdf_docs)

    # 2️⃣ Contexte Google
    urls = search_google_serpapi(question)
    google_texts = [get_page_text(u) for u in urls]
    context_google = "\n".join(google_texts)

    # 3️⃣ Fusionner les contextes
    context = context_pdf + "\n" + context_google

    # 4️⃣ QA CamemBERT
    result = qa_pipeline(question=question, context=context)
    if result and "answer" in result:
        return f"📖 Selon le contexte : {result['answer']}\n🌐 Sources Google : {urls}"
    else:
        return "⚠️ Aucun article trouvé dans le contexte."

# ===========================
# Main
# ===========================
if __name__ == "__main__":
    print("🔍 Chargement des PDF...")
    docs = load_documents("data/")
    docs = preprocess_documents(docs)
    docs = split_documents(docs)

    print("⚖️ Construction des retrievers...")
    bm25, faiss = build_retrievers(docs)
    retriever = HybridRetriever(bm25=bm25, faiss=faiss)

    # Tests
    questions = [
        "Qu'est-ce qu'un licenciement abusif en droit tunisien ?",
        "Quelle est la durée du préavis en cas de licenciement en Tunisie ?",
        "Combien de jours de congés payés annuels sont prévus par le Code du travail tunisien ?",
        "Quelles sont les conditions du licenciement économique en Tunisie ?",
        "Que dit l’article 125 du Code du travail tunisien ?"
    ]

    for q in questions:
        print("\n❓", q)
        print(rag_chain_hybrid(q, retriever))
