"""
End-to-end SQLAlchemy demo: create DB -> insert -> read -> update -> delete.
Run from this folder: python test_sqlalchemy.py
"""

from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# 1. DATABASE URL — where the SQLite file lives
# ---------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./autonova.db"

# ---------------------------------------------------------------------------
# 2. ENGINE — connection to the database file
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + threads
)

# ---------------------------------------------------------------------------
# 3. SESSION — ORM "workspace" for add/query/commit
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---------------------------------------------------------------------------
# 4. BASE — parent class; all models register tables here
# ---------------------------------------------------------------------------
Base = declarative_base()


# ---------------------------------------------------------------------------
# 5. MODEL — Python class maps to SQL table "leads"
# ---------------------------------------------------------------------------
class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    subreddit = Column(String)
    score = Column(Integer)
    status = Column(String, default="new")

    def __repr__(self):
        return f"<Lead id={self.id} username={self.username!r} score={self.score}>"


def main():
    # Step A: Create tables in DB if they don't exist yet
    print("1. Creating tables (if missing)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Step B: INSERT — add rows (not saved until commit)
        print("\n2. Inserting leads...")
        db.add_all(
            [
                Lead(username="founder123", subreddit="startups", score=8, status="new"),
                Lead(username="dev_girl", subreddit="SaaS", score=6, status="new"),
            ]
        )
        db.commit()
        print("   Committed.")

        # Step C: SELECT — read all leads
        print("\n3. All leads:")
        leads = db.query(Lead).order_by(Lead.id).all()
        for lead in leads:
            print(f"   {lead}")

        # Step D: UPDATE — change one row
        print("\n4. Updating founder123 score to 9...")
        lead = db.query(Lead).filter(Lead.username == "founder123").first()
        if lead:
            lead.score = 9
            lead.status = "qualified"
            db.commit()
            print(f"   Updated: {lead}")

        # Step E: DELETE — remove one row (demo only)
        print("\n5. Deleting dev_girl...")
        db.query(Lead).filter(Lead.username == "dev_girl").delete()
        db.commit()

        print("\n6. Final leads:")
        for lead in db.query(Lead).all():
            print(f"   {lead}")

    finally:
        db.close()
        print("\n7. Session closed.")


if __name__ == "__main__":
    main()
