from backend.repository.outreach_repository import get_outreach_queue

def getQueueOutreach(page,limit,db):
    return get_outreach_queue(page,limit,db)