"""Precision rules for the focused AI edition, versioned separately from queries."""
import re


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
