# models/__init__.py
from .animal_class import AnimalClass
from .user import User
from .species import Species
from .scanned_species import ScannedSpecies
from .reports import Report
from .friendships import Friendship
from .vouchers import Voucher
from .user_vouchers import UserVoucher
from .points_transactions import PointsTransaction

__all__ = [
    "AnimalClass",
    "User", 
    "Species",
    "ScannedSpecies", 
    "Report",
    "Friendship",
    "Voucher",
    "UserVoucher", 
    "PointsTransaction"
]