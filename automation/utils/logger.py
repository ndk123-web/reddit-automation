from automation.config.database import SessionLocal
from automation.models.logs import Logs

# Memory Buffer banayenge logs store karne ke liye
_log_buffer = []
BUFFER_LIMIT = 10  # Aap ise 50 ya 100 bhi kar sakte hain production mein

def add_log(event_type, message, status="info"):
    global _log_buffer

    # Naya log object banayenge bina DB mein insert kiye
    log_entry = Logs(
        event_type=event_type,
        message=message,
        status=status
    )
    _log_buffer.append(log_entry)

    # Agar limit poori ho gayi, toh bulk insert kardo
    if len(_log_buffer) >= BUFFER_LIMIT:
        flush_logs()

def flush_logs():
    global _log_buffer
    
    if not _log_buffer:
        return

    db = SessionLocal()
    try:
        # bulk_save_objects ek sath saare objects DB mein insert kar dega, yeh bahut fast hota hai
        db.bulk_save_objects(_log_buffer)
        db.commit()
        _log_buffer.clear()  # Insert hone ke baad buffer khaali kardo
    except Exception as e:
        db.rollback()
        print(f"Log bulk insert failed: {e}")
    finally:
        db.close()