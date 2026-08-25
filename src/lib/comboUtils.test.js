import { describe, expect, it } from 'vitest';
import { buildComboString, formatAttackLabel } from './comboUtils';

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
});
