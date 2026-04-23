from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import rooms
from .websockets import game

app = FastAPI(title="Cluedo Clone API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(rooms.router, prefix="/api")
app.include_router(game.router)

@app.get("/")
async def root():
    return {"message": "Cluedo Clone API is running"}
