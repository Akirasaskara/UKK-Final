import { describe, expect, it } from 'vitest';
import { sanitizeCsvCell } from '@/features/admin/reports/csv-export';

describe('CSV spreadsheet injection protection', () => {
  it.each(['=SUM(A1:A2)', '+cmd', '-10+20', '@IMPORTXML', '\tformula', '\rformula'])(
    'prefixes dangerous value %s with an apostrophe',
    (value) => {
      expect(sanitizeCsvCell(value)).toBe(`"'${value.trim()}"`);
    },
  );

  it('escapes double quotes and trims surrounding whitespace', () => {
    expect(sanitizeCsvCell('  Ruang "Utama"  ')).toBe('"Ruang ""Utama"""');
  });

  it('serializes null as an empty quoted cell', () => {
    expect(sanitizeCsvCell(null)).toBe('""');
  });
});
