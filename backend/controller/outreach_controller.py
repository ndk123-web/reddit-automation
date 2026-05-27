from backend.repository.outreach_repository import get_outreach_queue, update_outreach_queue_item

def getQueueOutreach(page,limit,db):
    return get_outreach_queue(page,limit,db)


def updateQueueOutreach(item_id, data, db):
    return update_outreach_queue_item(db, item_id, data.outreach_content)