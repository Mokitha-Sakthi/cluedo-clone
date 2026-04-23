from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from .manager import manager
from ..services.room_manager import room_manager
from ..services.game_logic import GameLogic

router = APIRouter()

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.connect(websocket, room_id, user_id)
    
    # Notify others that someone joined
    await manager.broadcast(room_id, {
        "type": "PLAYER_JOINED",
        "user_id": user_id,
        "state": room_manager.get_room_state(room_id)
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            room_state = room_manager.get_room_state(room_id)
            if not room_state:
                continue

            msg_type = message.get("type")
            
            if msg_type == "READY":
                new_state = room_manager.set_ready(room_id, user_id)
                await manager.broadcast(room_id, {
                    "type": "STATE_UPDATE",
                    "state": new_state
                })

            elif msg_type == "START_GAME":
                new_state = room_manager.start_game(room_id, user_id)
                if new_state:
                    await manager.broadcast(room_id, {
                        "type": "STATE_UPDATE",
                        "state": new_state
                    })

            elif msg_type == "SELECT_CHARACTER":
                character = message.get("character")
                new_state = room_manager.select_character(room_id, user_id, character)
                if new_state:
                    await manager.broadcast(room_id, {
                        "type": "STATE_UPDATE",
                        "state": new_state
                    })

            elif msg_type == "ROLL_DICE":
                game_data = room_state.get("game_data")
                if not game_data: continue
                
                # Check turn
                current_player = game_data["turn_order"][game_data["current_turn_index"]]
                if current_player != user_id: continue
                if game_data.get("last_roll"): continue # Already rolled
                
                roll = GameLogic.roll_dice()
                game_data["last_roll"] = roll
                room_manager.update_game_data(room_id, game_data)

                await manager.broadcast(room_id, {
                    "type": "DICE_ROLLED",
                    "user_id": user_id,
                    "roll": roll,
                    "state": room_manager.get_room_state(room_id)
                })

            elif msg_type == "MOVE":
                destination = message.get("position") # [row, col]
                game_data = room_state.get("game_data")
                if not game_data: continue
                
                # Check turn
                current_player = game_data["turn_order"][game_data["current_turn_index"]]
                if current_player != user_id: continue
                if not game_data.get("last_roll"): continue # Must roll first
                if game_data.get("moved_this_turn"): continue # Already moved

                # Validate distance (Manhattan distance for simplicity)
                curr_pos = game_data["player_positions"][user_id]
                dist = abs(curr_pos[0] - destination[0]) + abs(curr_pos[1] - destination[1])
                
                if dist <= game_data["last_roll"]:
                    game_data["player_positions"][user_id] = destination
                    game_data["moved_this_turn"] = True
                    room_manager.update_game_data(room_id, game_data)
                    
                    await manager.broadcast(room_id, {
                        "type": "PLAYER_MOVED",
                        "user_id": user_id,
                        "position": destination,
                        "state": room_manager.get_room_state(room_id)
                    })

            elif msg_type == "SUGGESTION":
                suspect = message.get("suspect")
                weapon = message.get("weapon")
                room = message.get("room")
                game_data = room_state.get("game_data")
                
                # Broadcast suggestion
                await manager.broadcast(room_id, {
                    "type": "SUGGESTION_MADE",
                    "user_id": user_id,
                    "suspect": suspect,
                    "weapon": weapon,
                    "room": room
                })
                
                # Logic to disprove
                disproof = GameLogic.validate_suggestion(
                    user_id, suspect, weapon, room,
                    game_data["turn_order"], game_data["player_cards"]
                )
                
                if disproof:
                    # Notify everyone that it was disproved (but not by what card, except to the suggester)
                    await manager.broadcast(room_id, {
                        "type": "SUGGESTION_DISPROVED",
                        "by": disproof["disproved_by"]
                    })
                    # Send private message to suggester
                    await manager.send_personal_message({
                        "type": "DISPROOF_CARD",
                        "card": disproof["card"],
                        "by": disproof["disproved_by"]
                    }, websocket)
                else:
                    await manager.broadcast(room_id, {
                        "type": "SUGGESTION_NOT_DISPROVED"
                    })
                
                # Change turn
                game_data["current_turn_index"] = (game_data["current_turn_index"] + 1) % len(game_data["turn_order"])
                game_data["last_roll"] = None
                game_data["moved_this_turn"] = False
                
                room_manager.update_game_data(room_id, game_data)
                await manager.broadcast(room_id, {
                    "type": "STATE_UPDATE",
                    "state": room_manager.get_room_state(room_id)
                })

            elif msg_type == "END_TURN":
                game_data = room_state.get("game_data")
                if not game_data: continue
                
                current_player = game_data["turn_order"][game_data["current_turn_index"]]
                if current_player != user_id: continue
                
                game_data["current_turn_index"] = (game_data["current_turn_index"] + 1) % len(game_data["turn_order"])
                game_data["last_roll"] = None
                game_data["moved_this_turn"] = False
                
                room_manager.update_game_data(room_id, game_data)
                await manager.broadcast(room_id, {
                    "type": "STATE_UPDATE",
                    "state": room_manager.get_room_state(room_id)
                })

            elif msg_type == "ACCUSATION":
                suspect = message.get("suspect")
                weapon = message.get("weapon")
                room = message.get("room")
                game_data = room_state.get("game_data")
                
                correct = GameLogic.check_accusation(game_data["solution"], suspect, weapon, room)
                
                if correct:
                    room_state["status"] = "finished"
                    game_data["winner"] = user_id
                    room_manager._set(f"room:{room_id}", room_state)
                    await manager.broadcast(room_id, {
                        "type": "GAME_OVER",
                        "winner": user_id,
                        "solution": game_data["solution"]
                    })
                else:
                    # Elimination logic (simple version: player can't win anymore)
                    # For now, just notify
                    await manager.broadcast(room_id, {
                        "type": "WRONG_ACCUSATION",
                        "user_id": user_id
                    })
                    # Change turn
                    game_data["current_turn_index"] = (game_data["current_turn_index"] + 1) % len(game_data["turn_order"])
                    game_data["last_roll"] = None
                    game_data["moved_this_turn"] = False
                    
                    room_manager.update_game_data(room_id, game_data)
                    await manager.broadcast(room_id, {
                        "type": "STATE_UPDATE",
                        "state": room_manager.get_room_state(room_id)
                    })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(room_id, {
            "type": "PLAYER_LEFT",
            "user_id": user_id
        })
