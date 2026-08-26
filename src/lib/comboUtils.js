export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function buildComboString(steps = []) {
  return steps
    .map((step) => {
      if (typeof step === 'string') return step;
      if (step && typeof step.label === 'string' && step.label.trim()) return step.label;
      if (step && typeof step.name === 'string') return step.name;
      if (step && typeof step.command === 'string') return step.command;
      if (step && typeof step.keypad === 'string') return step.keypad;
      return '';
    })
    .filter(Boolean)
    .join(' > ');
}

export function formatAttackLabel(attack = {}, notation = 'name') {
  if (!attack) return '';

  switch (notation) {
    case 'command':
      return attack.command || attack.name || attack.keypad || '';
    case 'keypad':
      return attack.keypad || attack.name || attack.command || '';
    case 'name':
    default:
      return attack.name || attack.label || attack.command || attack.keypad || '';
  }
}

const MOVE_KIND_GROUPS = [
  { label: '通常', type: 'normal', key: 'normalMoves' },
  { label: 'ジャンプ', type: 'jump', key: 'jumpMoves' },
  { label: 'その他', type: 'dash', key: 'dashMoves' },
];

export function getMoveGroupByKind(game = {}, kind = 'normal') {
  const group = MOVE_KIND_GROUPS.find((entry) => entry.type === kind) ?? MOVE_KIND_GROUPS[0];

  return {
    ...group,
    moves: game[group.key] || [],
  };
}

/**
 * Extracts a YouTube video ID from common YouTube URL formats.
 * Returns null for non-YouTube URLs.
 */
export function getYouTubeVideoId(url = '') {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      const [videoId] = parsed.pathname.split('/').filter(Boolean);
      return videoId || null;
    }
    if (parsed.hostname === 'youtube.com' || parsed.hostname === 'www.youtube.com') {
      return parsed.searchParams.get('v') || null;
    }
  } catch {
    // invalid URL
  }
  return null;
}

export const defaultData = {
  games: [
    {
      id: 'game_sf6',
      name: 'Street Fighter 6',
      normalMoves: [
        { id: 'normal_p', label: 'P', kind: 'normal' },
        { id: 'normal_k', label: 'K', kind: 'normal' },
        { id: 'normal_s', label: 'S', kind: 'normal' },
        { id: 'normal_c', label: 'C', kind: 'normal' },
      ],
      jumpMoves: [
        { id: 'jump_j', label: 'j', kind: 'jump' },
        { id: 'jump_jc', label: 'jc', kind: 'jump' },
      ],
      dashMoves: [
        { id: 'dash_66', label: '66', kind: 'dash' },
        { id: 'dash_44', label: '44', kind: 'dash' },
      ],
      characters: [
        {
          id: 'char_ryu',
          name: 'Ryu',
          specialMoves: [
            { id: 'move_hadou', name: '波動拳', command: '↓→P', keypad: '236P' },
            { id: 'move_shoryu', name: '昇竜拳', command: '→↓→P', keypad: '623P' },
            { id: 'move_tatsumaki', name: '竜巻旋風脚', command: '↓↙←K', keypad: '214K' },
          ],
          combos: [
            {
              id: 'combo_ryu_1',
              name: '波動拳-昇竜',
              steps: [
                { id: 'step_1', label: 'j', type: 'jump' },
                { id: 'step_2', label: '236P', type: 'special', name: '波動拳', command: '↓→P', keypad: '236P' },
                { id: 'step_3', label: '623P', type: 'special', name: '昇竜拳', command: '→↓→P', keypad: '623P' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
