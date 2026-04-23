import random
from typing import List, Dict, Optional, Tuple
from ..constants import SUSPECTS, WEAPONS, ROOMS

class GameLogic:
    @staticmethod
    def initialize_game(players: List[str], player_characters: Dict[str, str]) -> Dict:
        """
        Initializes the game state by selecting a solution and dealing cards.
        """
        print(f"DEBUG: Initializing game for players: {players}")
        from ..constants import SUSPECT_NAMES, WEAPONS, ROOMS, STARTING_POSITIONS
        
        try:
            # Select solution
            solution_suspect = random.choice(SUSPECT_NAMES)
            solution_weapon = random.choice(WEAPONS)
            solution_room = random.choice(ROOMS)

            solution = {
                "suspect": solution_suspect,
                "weapon": solution_weapon,
                "room": solution_room
            }
            print(f"DEBUG: Solution selected: {solution}")

            # Remove solution from pool for dealing
            dealing_suspects = [s for s in SUSPECT_NAMES if s != solution_suspect]
            dealing_weapons = [w for w in WEAPONS if w != solution_weapon]
            dealing_rooms = [r for r in ROOMS if r != solution_room]

            # Combine remaining cards
            all_cards = dealing_suspects + dealing_weapons + dealing_rooms
            random.shuffle(all_cards)

            # Distribute cards to players
            num_players = len(players)
            player_cards = {player: [] for player in players}
            
            for i, card in enumerate(all_cards):
                player_cards[players[i % num_players]].append(card)

            # Setup positions
            player_positions = {}
            for player, character in player_characters.items():
                player_positions[player] = STARTING_POSITIONS.get(character, (0, 0))

            # Randomize player order
            turn_order = players.copy()
            random.shuffle(turn_order)

            state = {
                "solution": solution,
                "player_cards": player_cards,
                "player_characters": player_characters,
                "turn_order": turn_order,
                "current_turn_index": 0,
                "status": "ongoing",
                "winner": None,
                "history": [],
                "player_positions": player_positions,
                "last_roll": None,
                "moved_this_turn": False
            }
            print("DEBUG: Game state initialized successfully")
            return state
        except Exception as e:
            print(f"ERROR in initialize_game: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    @staticmethod
    def roll_dice() -> int:
        return random.randint(1, 6)

    @staticmethod
    def validate_suggestion(suggester: str, suspect: str, weapon: str, room: str, 
                          turn_order: List[str], player_cards: Dict[str, List[str]]) -> Optional[Dict]:
        """
        Checks other players for cards to disprove the suggestion.
        Returns the first disproving card found and the player who has it.
        """
        start_index = turn_order.index(suggester)
        num_players = len(turn_order)

        for i in range(1, num_players):
            other_player = turn_order[(start_index + i) % num_players]
            cards = player_cards[other_player]
            
            # Find matching cards
            matches = [card for card in [suspect, weapon, room] if card in cards]
            
            if matches:
                # In Cluedo, if a player has multiple, they only show ONE (randomly or chosen)
                # For simplicity, we choose one.
                return {
                    "disproved_by": other_player,
                    "card": random.choice(matches)
                }
        
        return None # Not disproved

    @staticmethod
    def check_accusation(solution: Dict, suspect: str, weapon: str, room: str) -> bool:
        return (solution["suspect"] == suspect and 
                solution["weapon"] == weapon and 
                solution["room"] == room)
