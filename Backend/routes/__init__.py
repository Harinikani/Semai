# routes/__init__.py
from . import auth, users, species, friendships, reports, scanned_species, vouchers, points, badges, quiz

__all__ = [
    "auth",
    "users", 
    "species",
    "friendships",
    "reports",
    "scanned_species",
    "vouchers",
    "points",
    "badges",
    "quiz"
]