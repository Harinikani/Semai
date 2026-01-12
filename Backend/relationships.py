# relationships.py
from sqlalchemy.orm import relationship

def setup_relationships():
    """
    Setup all database relationships using lazy imports to avoid circular dependencies
    This function should be called after all models are defined
    """
    # Import inside function to avoid circular imports
    from models.user import User
    from models.animal_class import AnimalClass
    from models.species import Species
    from models.scanned_species import ScannedSpecies
    from models.reports import Report
    from models.friendships import Friendship
    from models.vouchers import Voucher
    from models.user_vouchers import UserVoucher
    from models.points_transactions import PointsTransaction
    
    # User relationships
    User.scanned_species = relationship("ScannedSpecies", back_populates="user")
    User.reports = relationship("Report", back_populates="user")
    User.friendships_initiated = relationship("Friendship", foreign_keys="[Friendship.user_id]", back_populates="user")
    User.friendships_received = relationship("Friendship", foreign_keys="[Friendship.friend_id]", back_populates="friend")
    User.user_vouchers = relationship("UserVoucher", back_populates="user")
    User.points_transactions = relationship("PointsTransaction", back_populates="user")
    
    # AnimalClass relationships
    AnimalClass.species = relationship("Species", back_populates="animal_class")
    
    # Species relationships
    Species.animal_class = relationship("AnimalClass", back_populates="species")
    Species.scanned_species = relationship("ScannedSpecies", back_populates="species")
    
    # ScannedSpecies relationships
    ScannedSpecies.user = relationship("User", back_populates="scanned_species")
    ScannedSpecies.species = relationship("Species", back_populates="scanned_species")
    ScannedSpecies.reports = relationship("Report", back_populates="scanned_species")
    
    # Report relationships
    Report.user = relationship("User", back_populates="reports")
    Report.scanned_species = relationship("ScannedSpecies", back_populates="reports")
    
    # Friendship relationships
    Friendship.user = relationship("User", foreign_keys=[Friendship.user_id], back_populates="friendships_initiated")
    Friendship.friend = relationship("User", foreign_keys=[Friendship.friend_id], back_populates="friendships_received")
    
    # Voucher relationships
    Voucher.user_vouchers = relationship("UserVoucher", back_populates="voucher")
    
    # UserVoucher relationships
    UserVoucher.user = relationship("User", back_populates="user_vouchers")
    UserVoucher.voucher = relationship("Voucher", back_populates="user_vouchers")
    
    # PointsTransaction relationships
    PointsTransaction.user = relationship("User", back_populates="points_transactions")

    print("✅ All database relationships configured successfully")