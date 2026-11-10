import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.scripts import refresh_data


class RefreshTests(unittest.TestCase):
    def test_deferred_refresh_does_not_process_sync_or_publish_stale_data(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory)
            (cache / 'refresh_status.json').write_text(json.dumps({'complete': False}))
            output = cache / 'output'
            commands = []
            with patch.object(sys, 'argv', ['refresh', '--cache-dir', directory]), \
                 patch.dict(os.environ, {'GITHUB_OUTPUT': str(output)}), \
                 patch.object(refresh_data, 'run', commands.append):
                refresh_data.main()
            self.assertEqual(len(commands), 1)
            self.assertIn('collect_openalex_data.py', commands[0][1])
            self.assertEqual(output.read_text(), 'outcome=deferred\n')
