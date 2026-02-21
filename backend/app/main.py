from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import organization
from app.api.routes import auth
from app.api.routes import forms
from app.api.routes import questions
from app.api.routes import responses
from app.api.routes import analytics
from app.api.routes import categories

app = FastAPI(
    title="InsightLoop API",
    version="1.0.0",
    description="Backend for InsightLoop feedback intelligence system"
)

# Allow all origins for now (customize for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organization.router)
app.include_router(auth.router)
app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(analytics.router)
app.include_router(categories.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "message": "Welcome to InsightLoop API!",
        "status": "running",
        "version": "1.0.0"
    }
