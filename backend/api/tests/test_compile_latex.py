import tempfile
import unittest
from pathlib import Path

from api.compile_latex import _apply_params_to_file, _flatten_params_structure


class CompileLatexSafetyTests(unittest.TestCase):
    def test_flatten_ignores_invalid_path_keys(self):
        params = {
            'sections': {
                'chapters': {
                    '../escape': {'titolo': 'bad'},
                    '04-soluzione': {'descrizioneProgetto': 'ok'},
                }
            }
        }

        flattened = _flatten_params_structure(params)
        file_paths = [item['filePath'] for item in flattened]

        self.assertIn('sections/chapters/04-soluzione.tex', file_paths)
        self.assertNotIn('sections/chapters/../escape.tex', file_paths)

    def test_apply_params_to_file_does_not_write_outside_base_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            base_dir = Path(tmp) / 'project'
            outside_dir = Path(tmp) / 'outside'
            base_dir.mkdir()
            outside_dir.mkdir()

            inside_tex = base_dir / 'main.tex'
            inside_tex.write_text('Hello \\{nome\\}', encoding='utf-8')

            outside_tex = outside_dir / 'stolen.tex'
            outside_tex.write_text('ORIGINAL', encoding='utf-8')

            _apply_params_to_file(base_dir, '../outside/stolen.tex', {'nome': 'Mario'})

            self.assertEqual(outside_tex.read_text(encoding='utf-8'), 'ORIGINAL')

            _apply_params_to_file(base_dir, 'main.tex', {'nome': 'Mario'})
            self.assertEqual(inside_tex.read_text(encoding='utf-8'), 'Hello Mario')


if __name__ == '__main__':
    unittest.main()
