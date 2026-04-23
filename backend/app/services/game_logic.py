import random
from typing import List, Dict, Optional, Tuple
from ..constants import SUSPECTS, WEAPONS, ROOMS

class GameLogic:
    @staticmethod
    def initialize_game(players: List[str]) -> Dict:
        """
        Initializes the game state by selecting a solution and dealing cards.
        """
        from ..constants import SUSPECT_NAMES
        suspect_pool = SUSPECT_NAMES.copy()
        weapons = WEAPONS.copy()
        rooms = ROOMS.copy()

        # Assign characters to players
        player_characters = {}
        shuffled_suspects = SUSPECT_NAMES.copy()
        random.shuffle(shuffled_suspects)
        for i, player in enumerate(players):
            player_characters[player] = shuffled_suspects[i]

        # Select solution
        solution_suspect = random.choice(SUSPECT_NAMES)
        solution_weapon = random.choice(weapons)
        solution_room = random.choice(rooms)

        solution = {
            "suspect": solution_suspect,
            "weapon": solution_weapon,
            "room": solution_room
        }

        # Remove solution from pool for dealing
        # (Suspects in cards are independent of players)
        dealing_suspects = [s for s in SUSPECT_NAMES if s != solution_suspect]
        dealing_weapons = [w for w in weapons if w != solution_weapon]
        dealing_rooms = [r for r in rooms if r != solution_room]

        # Combine remaining cards
        all_cards = dealing_suspects + dealing_weapons + dealing_rooms
        random.shuffle(all_cards)

        # Distribute cards to players
        num_players = len(players)
        player_cards = {player: [] for player in players}
        
        for i, card in enumerate(all_cards):
            player_cards[players[i % num_players]].append(card)

        # Randomize player order
        turn_order = players.copy()
        random.shuffle(turn_order)

        return {
            "solution": solution,
            "player_cards": player_cards,
            "player_characters": player_characters,
            "turn_order": turn_order,
            "current_turn_index": 0,
            "status": "ongoing",
            "winner": None,
            "history": [],
            "player_positions": {player: "Hall" for player in players} # Start in Hall
        }

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
