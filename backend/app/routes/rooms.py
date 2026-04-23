from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from ..services.room_manager import room_manager

router = APIRouter()

class CreateRoomRequest(BaseModel):
    user_id: str

class JoinRoomRequest(BaseModel):
    room_id: str
    user_id: str

@router.post("/create-room")
async def create_room(req: CreateRoomRequest):
    room_id = str(uuid.uuid4())[:8].upper()
    state = room_manager.create_room(room_id, req.user_id)
    return state

@router.post("/join-room")
async def join_room(req: JoinRoomRequest):
    state = room_manager.join_room(req.room_id, req.user_id)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found or full")
    return state

@router.get("/game-state/{room_id}")
async def get_state(room_id: str):
    state = room_manager.get_room_state(room_id)
    if not state:
        raise HTTPException(status_code=44, detail="Room not found")
    return state
