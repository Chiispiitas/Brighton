import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('image_brief', Path(__file__).resolve().parents[1] / 'tools/check-image-brief.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ReferencePreflightTests(unittest.TestCase):
    def brief(self):
        return {'asset_id': 'qa-outfit', 'kind': 'clothing', 'intent': 'generate',
                'reference_ids': ['R01', 'R03', 'R05', 'R06'], 'target_paths': [], 'prompt': 'New coherent garment.'}
    def test_mandatory_inputs_are_actual_existing_files(self):
        result = module.check(self.brief())
        self.assertEqual(result['input_count'], 4)
        self.assertTrue(all(Path(p).is_file() for p in result['input_paths']))
    def test_seven_references_are_allowed(self):
        brief = self.brief(); brief['reference_ids'] = ['R%02d' % i for i in range(1, 8)]
        self.assertEqual(module.check(brief)['input_count'], 7)
    def test_edit_target_counts_towards_seven(self):
        brief = self.brief(); brief.update(intent='edit', reference_ids=['R%02d' % i for i in range(1, 8)], target_paths=['assets/art/avatar-static-clothes-v1.png'])
        with self.assertRaisesRegex(ValueError, 'seven image inputs TOTAL'):
            module.check(brief)
    def test_missing_identity_reference_is_rejected(self):
        brief = self.brief(); brief['reference_ids'].remove('R01')
        with self.assertRaisesRegex(ValueError, 'Missing mandatory references'):
            module.check(brief)
    def test_edit_without_target_is_rejected(self):
        brief = self.brief(); brief['intent'] = 'edit'
        with self.assertRaisesRegex(ValueError, 'exact target'):
            module.check(brief)
    def test_changed_source_invalidates_pack(self):
        digest = module.digest
        with patch.object(module, 'digest', side_effect=lambda p: 'stale' if p.name == 'manifest.json' else digest(p)):
            with self.assertRaisesRegex(ValueError, 'stale'):
                module.check(self.brief())

if __name__ == '__main__':
    unittest.main()
