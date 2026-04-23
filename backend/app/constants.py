SUSPECTS = {
    "Miss Scarlett": {"color": "#E53935", "description": "The femme fatale"},
    "Colonel Mustard": {"color": "#FDD835", "description": "The retired military officer"},
    "Mrs. White": {"color": "#FAFAFA", "description": "The domestic housekeeper"},
    "Mr. Green": {"color": "#43A047", "description": "The businessman"},
    "Mrs. Peacock": {"color": "#1E88E5", "description": "The socialite"},
    "Professor Plum": {"color": "#8E24AA", "description": "The intellectual"}
}

WEAPONS = [
    "Candlestick",
    "Dagger",
    "Lead Pipe",
    "Revolver",
    "Rope",
    "Wrench"
]

ROOMS = [
    "Kitchen",
    "Ballroom",
    "Conservatory",
    "Dining Room",
    "Billiard Room",
    "Library",
    "Lounge",
    "Hall",
    "Study"
]

SUSPECT_NAMES = list(SUSPECTS.keys())

# Starting positions (row, col) on a 24x24 grid
STARTING_POSITIONS = {
    "Miss Scarlett": (24, 7),
    "Colonel Mustard": (17, 0),
    "Mrs. White": (0, 9),
    "Mr. Green": (0, 14),
    "Mrs. Peacock": (6, 23),
    "Professor Plum": (19, 23)
}

# Room boundaries (top, left, bottom, right) inclusive
ROOM_BOUNDARIES = {
    "Study": (0, 0, 3, 6),
    "Hall": (0, 9, 6, 14),
    "Lounge": (0, 17, 5, 23),
    "Library": (6, 0, 10, 6),
    "Billiard Room": (12, 0, 16, 5),
    "Dining Room": (9, 15, 15, 23),
    "Conservatory": (19, 0, 23, 5),
    "Ballroom": (17, 8, 23, 15),
    "Kitchen": (18, 18, 23, 23)
}
