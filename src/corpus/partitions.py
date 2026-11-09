"""Versioned query boundaries shared by acquisition and coverage reporting."""
from __future__ import annotations

import hashlib
import json
from datetime import date, timedelta

from src.scripts.collect_openalex_data import WORK_FIELDS
from src.analytics.work_relevance import boolean_search_query, short_openalex_id

WORK_TYPES = 'article|review|preprint|conference-paper|report'


def work_filters(topic, period):
    filters = [period, f'type:{WORK_TYPES}']
    ids = [short_openalex_id(identifier) for identifier in topic.get('openalex_topic_ids', [])]
    if ids:
        filters.append('topics.id:' + '|'.join(ids))
    return ','.join(filters)


def query_for(topic):
    # Match local AND-of-token query semantics. Source stemming can broaden
    # recall; local eligibility remains a separate, inspectable stage.
    query = boolean_search_query(topic.get('keyword_queries', []))
    if not query:
        raise ValueError(f'Topic {topic["slug"]} has no search boundary')
    if topic.get('editionSearch'):
        query = f'({query}) AND ({topic["editionSearch"]})'
    return query


def partition_plan(topics, start_year=2017, recent_days=None):
    plan = []
    for year in range(date.today().year, start_year - 1, -1):
        for topic in topics:
            params = {'search.title_and_abstract': query_for(topic), 'filter': work_filters(topic, f'publication_year:{year}'),
                      'per_page': 100, 'select': WORK_FIELDS + ',referenced_works,updated_date,is_retracted'}
            if recent_days:
                params['filter'] += f',from_publication_date:{date.today() - timedelta(days=recent_days)}'
            version = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
            plan.append({'id': f'{topic["slug"]}/{year}/{version}', 'topic': topic['slug'],
                         'year': year, 'params': params})
    return plan


def coverage_rows(store, plan):
    states = {row[0]: row[1:] for row in store.db.execute(
        'SELECT id,expected,fetched,complete,observed FROM partitions')}
    return [{**{key: item[key] for key in ('id', 'topic', 'year')},
             **dict(zip(('expected', 'fetched', 'complete', 'observed'),
                        states.get(item['id'], (None, 0, 0, None))))} for item in plan]
