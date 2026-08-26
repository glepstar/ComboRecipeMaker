import { describe, expect, it } from 'vitest';
import { buildComboString, formatAttackLabel, getMoveGroupByKind } from './comboUtils';

describe('comboUtils', () => {
  it('builds a combo string from steps', () => {
    expect(buildComboString([
      { label: 'j', type: 'jump' },
      { label: '236P', type: 'special' },
      { label: '623P', type: 'special' }
    ])).toBe('j > 236P > 623P');
  });

  it('formats attack labels using the selected notation', () => {
    expect(formatAttackLabel({ name: '波動拳', command: '↓→P', keypad: '236P' }, 'keypad')).toBe('236P');
    expect(formatAttackLabel({ name: '波動拳', command: '↓→P', keypad: '236P' }, 'command')).toBe('↓→P');
  });

  it('returns only the selected move group for normal move management', () => {
    const game = {
      normalMoves: [{ id: 'n1', label: 'P' }],
      jumpMoves: [{ id: 'j1', label: 'jP' }],
      dashMoves: [{ id: 'd1', label: '66' }],
    };

    expect(getMoveGroupByKind(game, 'jump')).toEqual({
      label: 'ジャンプ',
      type: 'jump',
      key: 'jumpMoves',
      moves: [{ id: 'j1', label: 'jP' }],
    });
  });

  it('falls back to normal moves when the selected kind is unknown', () => {
    expect(getMoveGroupByKind({ normalMoves: [{ id: 'n1', label: 'P' }] }, 'unknown')).toEqual({
      label: '通常',
      type: 'normal',
      key: 'normalMoves',
      moves: [{ id: 'n1', label: 'P' }],
    });
  });
});
