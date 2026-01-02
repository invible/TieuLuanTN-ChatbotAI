from app.db import SessionLocal
from app import models
from app.utils.auth import get_password_hash

def is_hashed(password: str) -> bool:
    return password.startswith("$2a$") or password.startswith("$2b$")

def migrate_passwords():
    db = SessionLocal()

    try:
        users = db.query(models.User).all()
        updated = 0

        for user in users:
            if not user.password:
                continue

            if is_hashed(user.password):
                print(f"[SKIP] {user.email} đã hash")
                continue

            raw_password = user.password[:72]  # 🔥 FIX QUAN TRỌNG
            user.password = get_password_hash(raw_password)
            updated += 1

            print(f"[UPDATE] {user.email}")

        if updated:
            db.commit()
            print(f"\n✅ Đã migrate {updated} user")

    except Exception as e:
        db.rollback()
        print("❌ Lỗi migrate:", e)

    finally:
        db.close()

if __name__ == "__main__":
    migrate_passwords()
