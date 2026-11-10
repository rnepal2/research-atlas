import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]


def workflow(name):
    # BaseLoader preserves GitHub's `on` key instead of YAML 1.1's boolean coercion.
    return yaml.load((ROOT / '.github' / 'workflows' / name).read_text(), Loader=yaml.BaseLoader)


class WorkflowContractTests(unittest.TestCase):
    def test_weekly_refresh_runs_on_main_and_publishes_only_fresh_data(self):
        data = workflow('refresh-data.yml')
        self.assertEqual(data['on']['schedule'][0]['cron'], '17 07 * * 1')
        self.assertEqual(data['jobs']['refresh']['if'], "github.ref == 'refs/heads/main'")
        steps = data['jobs']['refresh']['steps']
        for name in ('Build static site', 'Validate publishable research snapshot', 'Publish gh-pages branch'):
            step = next(step for step in steps if step.get('name') == name)
            self.assertEqual(step['if'], "steps.refresh.outputs.outcome == 'fresh'")

    def test_deployment_is_main_only_and_checks_built_snapshot(self):
        data = workflow('deploy.yml')
        self.assertEqual(data['on']['push']['branches'], ['main'])
        self.assertEqual(data['jobs']['deploy']['if'], "github.ref == 'refs/heads/main'")
        self.assertIn('Validate publishable research snapshot',
                      {step.get('name') for step in data['jobs']['deploy']['steps']})

    def test_backfill_is_manual_and_develop_only(self):
        data = workflow('research-corpus.yml')
        self.assertIn('workflow_dispatch', data['on'])
        self.assertNotIn('schedule', data['on'])
        self.assertEqual(data['jobs']['backfill']['if'], "github.ref == 'refs/heads/develop'")


if __name__ == '__main__':
    unittest.main()
