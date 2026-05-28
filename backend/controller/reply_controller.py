from sqlalchemy.orm import Session

from backend.repository.reply_repository import process_inbox_replies


def processReplies(db: Session, unread_messages):
    return process_inbox_replies(db, unread_messages)