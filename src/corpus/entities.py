"""Evidence-first entity aggregates. Never use presentation limits as denominators."""
from src.analytics.authorship import is_credible_author


def entity_evidence(works):
    authors = {}
    institutions = {}
    for work in works:
        identifier = work['id'].rsplit('/', 1)[-1]
        entries = work.get('authorships', [])
        credited = len({a['author']['id'] for a in entries if (a.get('author') or {}).get('id')}) + sum(not (a.get('author') or {}).get('id') for a in entries)
        seen_authors = set()
        seen_institutions = set()
        for entry in entries:
            author = entry.get('author') or {}
            person = bool(author.get('id')) and is_credible_author(author)
            row = None
            if person:
                row = authors.setdefault(author['id'], {'id':author['id'], 'name':author['display_name'], 'works':set(), 'citations':0, 'affiliations':set()})
                row['works'].add(identifier)
                if author['id'] not in seen_authors:
                    row['citations'] += (work.get('cited_by_count') or 0) / max(1, credited)
                seen_authors.add(author['id'])
            for institution in entry.get('institutions', []):
                if not institution.get('id'):
                    continue
                if row is not None:
                    row['affiliations'].add(institution.get('display_name') or institution['id'])
                group = institutions.setdefault(institution['id'], {'id':institution['id'], 'name':institution.get('display_name') or 'Institution not resolved', 'country':institution.get('country_code') or 'Unknown', 'works':set(), 'authors':set(), 'citations':0})
                group['works'].add(identifier)
                if person:
                    group['authors'].add(author['id'])
                if institution['id'] not in seen_institutions:
                    group['citations'] += work.get('cited_by_count') or 0
                seen_institutions.add(institution['id'])
    def serialize(rows):
        return sorted([{key: sorted(value) if isinstance(value,set) else round(value,2) if isinstance(value,float) else value for key,value in row.items()} for row in rows.values()], key=lambda row:(-len(row['works']),row['id']))
    return {'authors':serialize(authors), 'institutions':serialize(institutions)}
