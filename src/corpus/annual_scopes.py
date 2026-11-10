"""Exact set-union annual queries; never sum overlapping topic aggregates."""
from __future__ import annotations

import re
import time
from datetime import datetime, timezone

import requests

from src.analytics.work_relevance import boolean_search_query, short_openalex_id
from src.corpus.partitions import WORK_TYPES
from src.scripts.collect_openalex_data import OpenAlexClient, OpenAlexCollectionDeferredError


class AnnualQueryClient(OpenAlexClient):
    """POST long, nested queries without putting credentials in URLs or errors."""

    def query(self, query, check=False):
        endpoint = 'https://api.openalex.org/query' if check else 'https://api.openalex.org/'
        for attempt in range(self.max_attempts):
            time.sleep(max(0, self.min_interval - (time.time() - self.last_request_at)))
            try:
                response = self.session.post(endpoint, json={'oqo': query}, timeout=45)
            except requests.RequestException:
                response = None
            self.last_request_at = time.time()
            if response is not None and response.ok:
                return response.json()
            if response is not None and response.status_code not in {429, 500, 502, 503, 504}:
                raise ValueError(f'OpenAlex annual union query rejected (HTTP {response.status_code})')
            if attempt + 1 < self.max_attempts:
                time.sleep(min(self.max_retry_wait, 2 ** attempt))
        raise OpenAlexCollectionDeferredError('Annual union query unavailable; accepted context is unchanged.')


def boolean_node(expression):
    """Parse the restricted AND/OR grammar emitted by query_for, preserving scope."""
    tokens = re.findall(r'\(|\)|[A-Za-z0-9]+', expression)
    position = 0

    def term():
        nonlocal position
        token = tokens[position]
        position += 1
        if token == '(':
            node = expression_node('OR')
            if position >= len(tokens) or tokens[position] != ')':
                raise ValueError('Unbalanced annual query')
            position += 1
            return node
        if token in {'AND', 'OR', ')'}:
            raise ValueError('Invalid annual search term')
        return {'column_id': 'title_and_abstract.search', 'value': token, 'operator': 'has'}

    def expression_node(operator):
        nonlocal position
        parse = term if operator == 'AND' else lambda: expression_node('AND')
        nodes = [parse()]
        while position < len(tokens) and tokens[position] == operator:
            position += 1
            nodes.append(parse())
        return nodes[0] if len(nodes) == 1 else {'join': operator.lower(), 'filters': nodes}

    node = expression_node('OR')
    if position != len(tokens):
        raise ValueError('Unexpected annual query token')
    return node


def scope_definitions(topics):
    definitions = []
    for field in ['all', *sorted({t['field'] for t in topics})]:
        for track in ['all', 'methods', 'applications']:
            members = sorted(t['slug'] for t in topics if
                             (field == 'all' or t['field'] == field) and
                             (track == 'all' or t.get('editionRole', t.get('role')) == track))
            if members:
                definitions.append({'id': f'{field}/{track}', 'field': field, 'track': track,
                                    'topicSlugs': members})
    return definitions


def scope_query(topics, year=None):
    year = year or datetime.now(timezone.utc).year
    # Factor the shared application-method predicate once, not once per topic.
    # This is distributively equivalent and keeps the query planner bounded.
    grouped = {}
    for topic in sorted(topics, key=lambda t: t['slug']):
        filters = [boolean_node(boolean_search_query(topic.get('keyword_queries', [])))]
        ids = sorted({short_openalex_id(value) for value in topic.get('openalex_topic_ids', [])})
        if ids:
            filters.append({'join': 'or', 'filters': [{'column_id': 'topics.id', 'value': value} for value in ids]})
        grouped.setdefault(topic.get('editionSearch', ''), []).append({'join': 'and', 'filters': filters})
    branches = []
    for search, members in sorted(grouped.items()):
        filters = [{'join': 'or', 'filters': members}]
        if search:
            filters.append(boolean_node(search))
        branches.append({'join': 'and', 'filters': filters})
    return {'get_rows': 'works', 'filter_rows': [
        {'column_id': 'publication_year', 'value': year - 9, 'operator': '>='},
        {'column_id': 'publication_year', 'value': year, 'operator': '<='},
        {'join': 'or', 'filters': [{'column_id': 'type', 'value': value} for value in WORK_TYPES.split('|')]},
        {'join': 'or', 'filters': branches}],
        'group_by': [{'column_id': 'publication_year'}], 'calculate': [{'measure': 'count'}]}


def annual_counts(result, year):
    groups, total = result.get('group_by'), result.get('meta', {}).get('count')
    if not isinstance(groups, list) or type(total) is not int or total < 0 or result.get('meta', {}).get('more_groups'):
        raise ValueError('Unverifiable annual aggregate response')
    counts = {}
    for group in groups:
        key, count = str(group.get('key', '')), group.get('count')
        if not key.isdigit() or not year - 9 <= int(key) <= year or type(count) is not int or count < 0 or int(key) in counts:
            raise ValueError('Invalid annual aggregate group')
        counts[int(key)] = count
    if sum(counts.values()) != total:
        raise ValueError('Annual counts do not reconcile to query total')
    return [{'year': y, 'works': counts.get(y, 0)} for y in range(year - 9, year + 1)]
