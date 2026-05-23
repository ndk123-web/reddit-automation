KEYWORDS = []


def score_post(title, content):

    text = f"{title} {content}".lower()

    for keyword in KEYWORDS:

        if keyword in text:
            return 8

    return 3
