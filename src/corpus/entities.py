"""Evidence-first entity aggregates. Never use presentation limits as denominators."""
def entity_evidence(works):
    authors = {}
    institutions = {}
    for work in works:
        identifier = work['id'].rsplit('/', 1)[-1]
        entries = [a for a in work.get('authorships', []) if (a.get('author') or {}).get('id')]
        seen_authors = set()
        seen_institutions = set()
        for entry in entries:
            author = entry['author']
            row = authors.setdefault(author['id'], {'id':author['id'], 'name':author.get('display_name') or 'Author not resolved', 'works':set(), 'citations':0, 'affiliations':set()})
            row['works'].add(identifier)
            if author['id'] not in seen_authors:
                row['citations'] += (work.get('cited_by_count') or 0) / max(1,len({a['author']['id'] for a in entries}))
            seen_authors.add(author['id'])
            for institution in entry.get('institutions', []):
                if not institution.get('id'):
                    continue
                row['affiliations'].add(institution.get('display_name') or institution['id'])
                group = institutions.setdefault(institution['id'], {'id':institution['id'], 'name':institution.get('display_name') or 'Institution not resolved', 'country':institution.get('country_code') or 'Unknown', 'works':set(), 'authors':set(), 'citations':0})
                group['works'].add(identifier)
                group['authors'].add(author['id'])
                if institution['id'] not in seen_institutions:
                    group['citations'] += work.get('cited_by_count') or 0
                seen_institutions.add(institution['id'])
    def serialize(rows):
        return sorted([{key: sorted(value) if isinstance(value,set) else round(value,2) if isinstance(value,float) else value for key,value in row.items()} for row in rows.values()], key=lambda row:(-len(row['works']),row['id']))
    return {'authors':serialize(authors), 'institutions':serialize(institutions)}
