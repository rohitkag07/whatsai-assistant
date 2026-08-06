import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const DatasetRowSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  vertical: z.enum(['dental', 'gym', 'real_estate', 'coaching', 'salon']),
  intent: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
  language: z.literal('hinglish-latin'),
  typoSeverity: z.enum(['none', 'minor', 'moderate', 'severe']),
  split: z.literal('train'),
  source: z.literal('synthetic-template-v1'),
  containsPii: z.literal(false),
});

type DatasetRow = z.infer<typeof DatasetRowSchema>;

function loadDataset(): {
  readonly bytes: Buffer;
  readonly rows: readonly DatasetRow[];
} {
  const bytes = readFileSync(
    resolve(process.cwd(), 'datasets/hinglish-intents/train.jsonl'),
  );
  const rows = bytes
    .toString('utf8')
    .trim()
    .split('\n')
    .map((line) => DatasetRowSchema.parse(JSON.parse(line) as unknown));
  return { bytes, rows };
}

function countsBy(
  rows: readonly DatasetRow[],
  select: (row: DatasetRow) => string,
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = select(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

describe('Hinglish intent dataset release', () => {
  it('contains the documented unique, balanced 1,800-row release', () => {
    const { rows } = loadDataset();

    expect(rows).toHaveLength(1_800);
    expect(new Set(rows.map((row) => row.id)).size).toBe(1_800);
    expect(new Set(rows.map((row) => row.text)).size).toBe(1_800);
    expect(new Set(rows.map((row) => row.intent)).size).toBe(30);
    expect(countsBy(rows, (row) => row.vertical)).toEqual({
      dental: 360,
      gym: 360,
      real_estate: 360,
      coaching: 360,
      salon: 360,
    });
    expect(countsBy(rows, (row) => row.typoSeverity)).toEqual({
      none: 450,
      minor: 450,
      moderate: 450,
      severe: 450,
    });
  });

  it('matches the governed release checksum', () => {
    const { bytes } = loadDataset();
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      '47fa090825aa3ca8f7f0871fb028441f855c9b3307416b87260d141fc070771f',
    );
  });
});
