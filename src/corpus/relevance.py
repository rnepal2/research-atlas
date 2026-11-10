"""Precision rules for the focused AI edition, versioned separately from queries."""
from __future__ import annotations
import re
from datetime import date
from functools import lru_cache


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


@lru_cache(maxsize=1)
def method_patterns():
    from src.corpus.scope import edition_policy
    return [(family['id'], re.compile(r'\b(?:' + '|'.join(
        r'[\s-]+'.join(re.escape(word) for word in term.split()) + r's?'
        for term in family['terms']) + r')\b', re.I))
        for family in edition_policy()['method_families']]


def method_tags(text: str) -> list[str]:
    """Observed title/abstract terminology, not a judgment of central contribution."""
    return [identifier for identifier, pattern in method_patterns() if pattern.search(text)]


def edition_eligible(work: dict, topic: dict | None = None) -> bool:
    if topic and topic.get('editionRole') == 'applications':
        words = {position: word for word, positions in (work.get('abstract_inverted_index') or {}).items() for position in positions}
        text = str(work.get('title') or '') + ' ' + ' '.join(words[i] for i in sorted(words))
        relevant = bool(method_tags(text))
    else:
        relevant = True if topic and topic.get('editionRole') == 'methods' else title_is_ai(work)
    return (
        work.get('type') in {'article', 'review', 'preprint', 'conference-paper', 'proceedings-article', 'report'}
        and 2017 <= int(work.get('publication_year') or 0) <= date.today().year
        and relevant
    )
