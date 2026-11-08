"""Precision rules for the focused AI edition, versioned separately from queries."""
from __future__ import annotations
import re
from datetime import date


TITLE_ANCHORS = re.compile(
    r'\b(llms?|gpt\w*|bert\w*|transformers?|chatbots?|chatgpt|rag|agents?)\b'
    r'|language model|artificial intelligence|retrieval.augmented|word (vector|embedding)'
    r'|neural language|multimodal|vision.language|instruction.tuning'
    r'|reinforcement learning.*feedback'
)


def title_is_ai(work: dict) -> bool:
    """Conservative title gate; it intentionally trades recall for precision."""
    title = str(work.get('title') or work.get('display_name') or '').lower()
    return bool(TITLE_ANCHORS.search(title))


APPLICATION_METHODS = re.compile(r'\b(machine learning|deep learning|artificial intelligence|neural network\w*|large language model\w*|graph neural|reinforcement learning|computer vision)\b', re.I)


def edition_eligible(work: dict, topic: dict | None = None) -> bool:
    if topic and topic.get('editionRole') == 'applications':
        words = {position: word for word, positions in (work.get('abstract_inverted_index') or {}).items() for position in positions}
        text = str(work.get('title') or '') + ' ' + ' '.join(words[i] for i in sorted(words))
        relevant = bool(APPLICATION_METHODS.search(text))
    else:
        relevant = True if topic and topic.get('editionRole') == 'methods' else title_is_ai(work)
    return (
        work.get('type') in {'article', 'review', 'preprint', 'conference-paper', 'proceedings-article', 'report'}
        and 2017 <= int(work.get('publication_year') or 0) <= date.today().year
        and relevant
    )
