from automation.config.database import SessionLocal
from automation.models.logs import Logs
import threading

# Memory Buffer banayenge logs store karne ke liye
_log_buffer = []
BUFFER_LIMIT = 10  # Aap ise 50 ya 100 bhi kar sakte hain production mein
_lock = threading.Lock()  # Threads ko control karne ke liye Lock

def add_log(event_type, message, status="info"):
    global _log_buffer

    # Naya log object banayenge bina DB mein insert kiye
    log_entry = Logs(
        event_type=event_type,
        message=message,
        status=status
    )
    
    # Lock use kar rahe hain taaki jab ek thread list mein add kare toh dusra wait kare
    with _lock:
        _log_buffer.append(log_entry)
        # Agar limit poori ho gayi, toh bulk insert kardo
        if len(_log_buffer) >= BUFFER_LIMIT:
            _flush_logs_internal()

def flush_logs():
    # Bahar se bulane wala flush function (yeh bhi thread-safe hai)
    with _lock:
        _flush_logs_internal()

def _flush_logs_internal():
    # Actual DB save logic (Lock ke andar hi chalna chahiye)
    global _log_buffer
    
    if not _log_buffer:
        return

    db = SessionLocal()
    try:
        # bulk_save_objects ek sath saare objects DB mein insert kar dega
        db.bulk_save_objects(_log_buffer)
        db.commit()
        _log_buffer.clear()  # Insert hone ke baad buffer khaali kardo
    except Exception as e:
        db.rollback()
        print(f"Log bulk insert failed: {e}")
    finally:
        db.close()