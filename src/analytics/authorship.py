"""Conservative person-name eligibility, shared by both publication pipelines."""


def is_credible_author(author: dict) -> bool:
    name = str(author.get('display_name') or '').strip()
    non_person_markers = ('anonymous', 'assignee', 'research team', 'research group',
                          'working group', 'consortium', 'collaboration')
    return bool(name) and '*' not in name and not any(marker in name.casefold() for marker in non_person_markers)
