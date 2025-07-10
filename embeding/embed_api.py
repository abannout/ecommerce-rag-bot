from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
model = SentenceTransformer('intfloat/multilingual-e5-small')  # or 'bge-small-en'

# Allow CORS for local dev or from Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with your domain for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbedRequest(BaseModel):
    text: str

@app.post("/embed")
async def embed_text(data: EmbedRequest):
    embedding = model.encode([data.text])[0]
    return {"embedding": embedding.tolist()}
