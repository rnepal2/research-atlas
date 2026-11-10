"""Audit acquired candidate records before spending the rest of the backfill budget."""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

from src.analytics.work_relevance import work_matches_topic
from src.corpus.focused import DB, focused_topics
from src.corpus.relevance import edition_eligible


def audit(db_path: Path = DB) -> dict:
    _, topics = focused_topics()
    if not db_path.exists():
        raise FileNotFoundError(db_path)
    rows = []
    with sqlite3.connect(f'file:{db_path}?mode=ro', uri=True) as db:
        for topic in topics:
            counts = {'acquired': 0, 'eligible': 0, 'withoutAbstract': 0,
                      'failedLocalQuery': 0, 'failedEditionRule': 0}
            by_year = {}
            examples = []
            for (payload,) in db.execute(
                'SELECT works.payload FROM memberships JOIN works ON works.id=memberships.work WHERE memberships.topic=?',
                (topic['slug'],),
            ):
                work = json.loads(payload)
                year = work.get('publication_year')
                year_counts = by_year.setdefault(str(year), {'acquired': 0, 'eligible': 0})
                counts['acquired'] += 1
                year_counts['acquired'] += 1
                if not work.get('abstract_inverted_index'):
                    counts['withoutAbstract'] += 1
                query_match = work_matches_topic(work, topic)
                edition_match = edition_eligible(work, topic)
                if not query_match:
                    counts['failedLocalQuery'] += 1
                if not edition_match:
                    counts['failedEditionRule'] += 1
                if edition_match and query_match:
                    counts['eligible'] += 1
                    year_counts['eligible'] += 1
                elif len(examples) < 3:
                    examples.append({'id': work['id'], 'title': work.get('title')})
            rows.append({'slug': topic['slug'], **counts, 'byYear': dict(sorted(by_year.items())),
                         'excludedExamples': examples})
    return {'scope': 'Acquired records only; first-page pilot is not a representative precision sample.',
            'topics': rows}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=DB)
    args = parser.parse_args()
    print(json.dumps(audit(args.db), indent=2))
