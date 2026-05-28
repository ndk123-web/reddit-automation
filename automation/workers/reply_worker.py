from __future__ import annotations

import os
import time
from datetime import datetime

from automation.config.database import SessionLocal
from automation.repository.reply_repository import process_inbox_replies
from automation.service.reddit_service import fetch_unread_inbox_messages
from automation.utils.logger import add_log, flush_logs


LOCK_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reply.lock")


def run_reply_worker():
    if os.path.exists(LOCK_FILE):
        if time.time() - os.path.getmtime(LOCK_FILE) > 600:
            try:
                os.remove(LOCK_FILE)
            except OSError:
                pass
        else:
            print("Reply worker is already running. Skipping...")
            return False

    with open(LOCK_FILE, "w") as file_handle:
        file_handle.write(str(time.time()))

    db = SessionLocal()
    add_log("REPLY_WORKER_START", "Starting Reddit reply worker cycle", "info")

    try:
        unread_messages = fetch_unread_inbox_messages()
        reply_result = process_inbox_replies(db, unread_messages)

        add_log(
            "REPLY_WORKER_SUCCESS",
            (
                f"Processed {reply_result['processed']} inbox messages, "
                f"replied={reply_result['replied']}, opted_out={reply_result['opted_out']}"
            ),
            "success",
        )
        print(
            "Reply worker completed: "
            f"processed={reply_result['processed']}, replied={reply_result['replied']}, opted_out={reply_result['opted_out']}"
        )
    except Exception as exc:
        db.rollback()
        add_log("REPLY_WORKER_ERROR", f"Reply worker failed: {exc}", "error")
        print(f"Reply worker crashed: {exc}")
    finally:
        db.close()
        add_log("REPLY_WORKER_END", "Reply worker cycle finished", "info")
        flush_logs()
        if os.path.exists(LOCK_FILE):
            try:
                os.remove(LOCK_FILE)
            except OSError:
                pass

    return True