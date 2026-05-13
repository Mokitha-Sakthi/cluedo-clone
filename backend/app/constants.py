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

STARTING_POSITIONS = {
    "Miss Scarlett": (22, 8),
    "Colonel Mustard": (22, 16),
    "Mrs. White": (0, 7),
    "Mr. Green": (0, 16),
    "Mrs. Peacock": (5, 23),
    "Professor Plum": (7, 0)
}

# Room boundaries (top, left, bottom, right) inclusive
ROOM_BOUNDARIES = {
    "Study": (19, 17, 22, 23),
    "Hall": (16, 9, 22, 14),
    "Lounge": (17, 0, 22, 6),
    "Library": (13, 17, 17, 23),
    "Billiard Room": (7, 18, 11, 23),
    "Dining Room": (8, 0, 14, 8),
    "Conservatory": (0, 18, 4, 23),
    "Ballroom": (0, 8, 6, 15),
    "Kitchen": (0, 0, 5, 5)
}
