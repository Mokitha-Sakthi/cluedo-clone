# Cluedo Clone

A full-stack multiplayer Cluedo (Clue) web game.

## Features
- Real-time gameplay with WebSockets
- Suggestion and Accusation mechanics
- Dynamic Notebook system
- Modern UI

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: FastAPI, WebSockets
- **State Management**: Redis (Planned/Implemented in logic)

## Setup & Running

### Backend
1. Navigate to `backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `uvicorn app.main:app --reload`

### Frontend
1. Navigate to `frontend`
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## Gameplay
- Create a room and share the Room ID with friends.
- Everyone must click "Ready Up" to start.
- Roll dice, move between rooms, and make suggestions to find the killer!
