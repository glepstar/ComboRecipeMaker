import { describe, expect, it } from 'vitest';
import { buildComboString, formatAttackLabel, getMoveGroupByKind, getYouTubeVideoId } from './comboUtils';

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

  describe('getYouTubeVideoId', () => {
    it('extracts video ID from a standard youtube.com watch URL', () => {
      expect(getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from a youtu.be short URL', () => {
      expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts only the first path segment for youtu.be URLs', () => {
      expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ/extra')).toBe('dQw4w9WgXcQ');
      expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ/')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for a non-YouTube URL', () => {
      expect(getYouTubeVideoId('https://x.com/user/status/123')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(getYouTubeVideoId('')).toBeNull();
    });

    it('returns null for an invalid URL string', () => {
      expect(getYouTubeVideoId('not-a-url')).toBeNull();
    });
  });
});
