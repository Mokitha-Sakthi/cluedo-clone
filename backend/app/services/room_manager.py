import json
import redis
from typing import Optional, Dict
from ..services.game_logic import GameLogic

# Connect to Redis
# In production, these should be from env variables
REDIS_HOST = "localhost"
REDIS_PORT = 6379

class RoomManager:
    def __init__(self):
        try:
            self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
            self.redis.ping()
        except Exception:
            print("WARNING: Redis not connected. Using in-memory fallback for development.")
            self.redis = None
            self._fallback_storage = {}

    def _get(self, key: str):
        if self.redis:
            val = self.redis.get(key)
            return json.loads(val) if val else None
        return self._fallback_storage.get(key)

    def _set(self, key: str, value: dict):
        if self.redis:
            self.redis.set(key, json.dumps(value))
        else:
            self._fallback_storage[key] = value

    def create_room(self, room_id: str, creator_id: str) -> Dict:
        state = {
            "room_id": room_id,
            "creator_id": creator_id,
            "players": [creator_id],
            "ready_players": [],
            "selected_characters": {}, # user_id -> character_name
            "status": "waiting", # waiting, ongoing, finished
            "game_data": None
        }
        self._set(f"room:{room_id}", state)
        return state

    def join_room(self, room_id: str, user_id: str) -> Optional[Dict]:
        state = self._get(f"room:{room_id}")
        if not state:
            return None
        
        if user_id not in state["players"]:
            if len(state["players"]) >= 6:
                return None # Room full
            state["players"].append(user_id)
            self._set(f"room:{room_id}", state)
        return state

    def select_character(self, room_id: str, user_id: str, character: str) -> Optional[Dict]:
        state = self._get(f"room:{room_id}")
        if not state:
            return None
        
        # Check if character is already taken
        for uid, char in state["selected_characters"].items():
            if char == character and uid != user_id:
                return None # Taken
        
        state["selected_characters"][user_id] = character
        self._set(f"room:{room_id}", state)
        return state

    def set_ready(self, room_id: str, user_id: str) -> Optional[Dict]:
        state = self._get(f"room:{room_id}")
        if not state:
            return None
        
        # Ensure player has selected a character
        if user_id not in state["selected_characters"]:
            return None

        if user_id not in state["ready_players"]:
            state["ready_players"].append(user_id)
            self._set(f"room:{room_id}", state)
        return state

    def start_game(self, room_id: str, user_id: str) -> Optional[Dict]:
        state = self._get(f"room:{room_id}")
        if not state:
            print(f"DEBUG: start_game failed - Room {room_id} not found")
            return None
        
        # Only creator can start
        if state.get("creator_id") != user_id:
            print(f"DEBUG: start_game failed - User {user_id} is not creator {state.get('creator_id')}")
            return None
        
        # All players must be ready and min 2 players
        ready_count = len(state["ready_players"])
        player_count = len(state["players"])
        print(f"DEBUG: Starting game check - Ready: {ready_count}, Total: {player_count}")
        
        if ready_count == player_count and player_count >= 2:
            state["status"] = "ongoing"
            try:
                state["game_data"] = GameLogic.initialize_game(state["players"], state["selected_characters"])
                self._set(f"room:{room_id}", state)
                print(f"DEBUG: Game started successfully in Room {room_id}")
                return state
            except Exception as e:
                print(f"DEBUG: GameLogic.initialize_game failed: {str(e)}")
                return None
        
        print(f"DEBUG: start_game failed - Not all players ready or < 2 players")
        return None

    def get_room_state(self, room_id: str) -> Optional[Dict]:
        return self._get(f"room:{room_id}")

    def update_game_data(self, room_id: str, game_data: Dict):
        state = self._get(f"room:{room_id}")
        if state:
            state["game_data"] = game_data
            self._set(f"room:{room_id}", state)

room_manager = RoomManager()
