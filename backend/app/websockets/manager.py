from fastapi import WebSocket
from typing import Dict, List, Set

class ConnectionManager:
    def __init__(self):
        # room_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> user_id
        self.user_map: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.user_map[websocket] = user_id

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
        if websocket in self.user_map:
            del self.user_map[websocket]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()
