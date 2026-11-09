"""Edition policy: computational methods and their domain-specific applications."""
from pathlib import Path
import yaml

from src.scripts.collect_openalex_data import load_config


def edition_policy():
    policy = yaml.safe_load(Path('data/config/edition.yaml').read_text())
    from src.analytics.work_relevance import boolean_search_query
    policy['applications']['search'] = boolean_search_query([
        term for family in policy['method_families'] for term in family['terms']
    ])
    return policy


def edition_topics():
    policy = edition_policy()
    topics = load_config(Path('data/config/topics.yaml'))
    for topic in topics:
        topic.update(policy.get('topic_overrides', {}).get(topic['slug'], {}))
        method = topic.get('field') in policy['methods']['fields'] or topic.get('work_area') in policy['methods']['work_areas']
        topic['editionRole'] = 'methods' if method else 'applications'
        topic['editionLabel'] = policy.get('labels', {}).get(topic['slug'], topic['label'])
        if not method:
            topic['editionSearch'] = policy['applications']['search']
    return topics
