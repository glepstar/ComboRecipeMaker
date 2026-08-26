import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildComboString,
  createId,
  defaultData,
  formatAttackLabel,
  getMoveGroupByKind,
} from './lib/comboUtils';

const STORAGE_KEY = 'combo-recipe-maker-data';

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function loadInitialData() {
  if (typeof window === 'undefined') {
    return cloneData(defaultData);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneData(defaultData);
    }

    const parsed = JSON.parse(raw);
    return parsed.games ? parsed : cloneData(defaultData);
  } catch (error) {
    return cloneData(defaultData);
  }
}

function getActionLabel(action, notation) {
  if (action.type === 'special') {
    return formatAttackLabel(action, notation);
  }

  return action.label || action.name || action.command || action.keypad || '';
}

function App() {
  const [data, setData] = useState(loadInitialData);
  const [selectedGameId, setSelectedGameId] = useState(() => loadInitialData().games[0]?.id ?? '');
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    () => loadInitialData().games[0]?.characters?.[0]?.id ?? '',
  );

  const [newGameName, setNewGameName] = useState('');
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newMoveName, setNewMoveName] = useState('');
  const [newMoveKind, setNewMoveKind] = useState('normal');
  const [newSpecialName, setNewSpecialName] = useState('');
  const [notation, setNotation] = useState('name');
  const [editingGameId, setEditingGameId] = useState('');
  const [editingGameName, setEditingGameName] = useState('');
  const [editingCharacterId, setEditingCharacterId] = useState('');
  const [editingCharacterName, setEditingCharacterName] = useState('');
  const [activeTab, setActiveTab] = useState('builder');
  const [draft, setDraft] = useState([]);
  const [comboName, setComboName] = useState('');
  const [selectedComboId, setSelectedComboId] = useState('');
  const [jsonText, setJsonText] = useState('');
  const editCancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const games = data.games || [];
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? games[0] ?? null;

  useEffect(() => {
    if (!selectedGame && games[0]) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGame]);

  const selectedCharacter =
    selectedGame?.characters?.find((character) => character.id === selectedCharacterId) ??
    selectedGame?.characters?.[0] ??
    null;

  useEffect(() => {
    if (!selectedGame) {
      setSelectedCharacterId('');
      return;
    }

    const hasCurrentCharacter = selectedGame.characters.some(
      (character) => character.id === selectedCharacterId,
    );

    if (!hasCurrentCharacter) {
      setSelectedCharacterId(selectedGame.characters[0]?.id ?? '');
    }
  }, [selectedGame, selectedCharacterId]);

  useEffect(() => {
    setComboName('');
    setDraft([]);
    setSelectedComboId('');
  }, [selectedGameId, selectedCharacterId]);

  const actionGroups = useMemo(() => {
    if (!selectedGame) {
      return [];
    }

    return [
      {
        title: '通常技',
        key: 'normal',
        actions: (selectedGame.normalMoves || []).map((move) => ({
          ...move,
          type: 'normal',
          label: move.label,
        })),
      },
      {
        title: 'ジャンプ',
        key: 'jump',
        actions: (selectedGame.jumpMoves || []).map((move) => ({
          ...move,
          type: 'jump',
          label: move.label,
        })),
      },
      {
        title: 'その他',
        key: 'dash',
        actions: (selectedGame.dashMoves || []).map((move) => ({
          ...move,
          type: 'dash',
          label: move.label,
        })),
      },
      {
        title: '必殺技',
        key: 'special',
        actions: (selectedCharacter?.specialMoves || []).map((move) => ({
          ...move,
          type: 'special',
          label: move.name || move.label || move.command || move.keypad || '必殺技',
        })),
      },
    ].filter((group) => group.actions.length > 0);
  }, [selectedCharacter, selectedGame]);

  const selectedMoveGroup = useMemo(
    () => getMoveGroupByKind(selectedGame, newMoveKind),
    [newMoveKind, selectedGame],
  );

  const createGame = () => {
    const trimmed = newGameName.trim();
    if (!trimmed) return;

    const newGame = {
      id: createId('game'),
      name: trimmed,
      normalMoves: [],
      jumpMoves: [],
      dashMoves: [],
      characters: [],
    };

    setData((prev) => ({
      ...prev,
      games: [...prev.games, newGame],
    }));
    setSelectedGameId(newGame.id);
    setNewGameName('');
  };

  const createCharacter = () => {
    if (!selectedGame) return;

    const trimmed = newCharacterName.trim();
    if (!trimmed) return;

    const newCharacter = {
      id: createId('character'),
      name: trimmed,
      specialMoves: [],
      combos: [],
    };

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) =>
        game.id === selectedGame.id
          ? { ...game, characters: [...game.characters, newCharacter] }
          : game,
      ),
    }));
    setSelectedCharacterId(newCharacter.id);
    setNewCharacterName('');
  };

  const addMove = () => {
    if (!selectedGame || !newMoveName.trim()) return;

    const move = {
      id: createId('move'),
      label: newMoveName.trim(),
      kind: newMoveKind,
    };

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        if (newMoveKind === 'normal') {
          return { ...game, normalMoves: [...game.normalMoves, move] };
        }

        if (newMoveKind === 'jump') {
          return { ...game, jumpMoves: [...game.jumpMoves, move] };
        }

        return { ...game, dashMoves: [...game.dashMoves, move] };
      }),
    }));
    setNewMoveName('');
  };

  const addSpecialMove = () => {
    if (!selectedCharacter) return;

    const name = newSpecialName.trim();
    if (!name) return;

    const move = {
      id: createId('special'),
      name,
    };

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) =>
            character.id === selectedCharacter.id
              ? { ...character, specialMoves: [...character.specialMoves, move] }
              : character,
          ),
        };
      }),
    }));

    setNewSpecialName('');
  };

  const addActionToDraft = (action) => {
    if (!action) return;

    setDraft((prev) => [
      ...prev,
      {
        ...action,
        id: createId('step'),
        label: action.label || getActionLabel(action, 'name'),
      },
    ]);
  };

  const undoLastStep = () => {
    setDraft((prev) => prev.slice(0, -1));
  };

  const saveCombo = () => {
    if (!selectedCharacter) return;

    const combo = {
      id: selectedComboId || createId('combo'),
      name: comboName.trim() || `コンボ ${selectedCharacter.combos.length + 1}`,
      steps: draft.map((step) => ({
        ...step,
        label: step.label || getActionLabel(step, 'name'),
      })),
    };

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) => {
            if (character.id !== selectedCharacter.id) return character;

            const existingCombos = character.combos || [];
            const updated = existingCombos.some((entry) => entry.id === combo.id)
              ? existingCombos.map((entry) => (entry.id === combo.id ? combo : entry))
              : [...existingCombos, combo];

            return { ...character, combos: updated };
          }),
        };
      }),
    }));

    setSelectedComboId('');
    setComboName(combo.name);
  };

  const selectCombo = (combo) => {
    setSelectedComboId(combo.id);
    setComboName(combo.name);
    setDraft((combo.steps || []).map((step) => ({
      ...step,
      label: step.label || step.name || step.command || step.keypad || '必殺技',
    })));
  };

  const deleteCombo = (comboId) => {
    if (!selectedCharacter) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) =>
            character.id === selectedCharacter.id
              ? {
                  ...character,
                  combos: (character.combos || []).filter((combo) => combo.id !== comboId),
                }
              : character,
          ),
        };
      }),
    }));

    if (selectedComboId === comboId) {
      setSelectedComboId('');
      setComboName('');
      setDraft([]);
    }
  };

  const removeGame = (gameId) => {
    setData((prev) => ({
      ...prev,
      games: prev.games.filter((game) => game.id !== gameId),
    }));
  };

  const renameGame = (gameId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) =>
        game.id === gameId ? { ...game, name: trimmed } : game,
      ),
    }));
  };

  const renameCharacter = (characterId, newName) => {
    if (!selectedGame) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) =>
            character.id === characterId ? { ...character, name: trimmed } : character,
          ),
        };
      }),
    }));
  };

  const copyCharacter = (characterId) => {
    if (!selectedGame) return;

    const source = selectedGame.characters.find((c) => c.id === characterId);
    if (!source) return;

    const newCharacter = {
      ...JSON.parse(JSON.stringify(source)),
      id: createId('character'),
      name: `${source.name} (コピー)`,
      specialMoves: (source.specialMoves || []).map((move) => ({ ...move, id: createId('special') })),
      combos: (source.combos || []).map((combo) => ({
        ...JSON.parse(JSON.stringify(combo)),
        id: createId('combo'),
        steps: (combo.steps || []).map((step) => ({ ...step, id: createId('step') })),
      })),
    };

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        const index = game.characters.findIndex((c) => c.id === characterId);
        const updated = [...game.characters];
        updated.splice(index + 1, 0, newCharacter);
        return { ...game, characters: updated };
      }),
    }));
    setSelectedCharacterId(newCharacter.id);
  };

  const removeCharacter = (characterId) => {
    if (!selectedGame) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.filter((character) => character.id !== characterId),
        };
      }),
    }));
  };

  const removeMove = (type, moveId) => {
    if (!selectedGame) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        if (type === 'normal') {
          return { ...game, normalMoves: game.normalMoves.filter((move) => move.id !== moveId) };
        }

        if (type === 'jump') {
          return { ...game, jumpMoves: game.jumpMoves.filter((move) => move.id !== moveId) };
        }

        return { ...game, dashMoves: game.dashMoves.filter((move) => move.id !== moveId) };
      }),
    }));
  };

  const reorderMove = (type, fromIndex, toIndex) => {
    if (!selectedGame) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        const reorder = (list) => {
          const next = [...list];
          const [item] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, item);
          return next;
        };

        if (type === 'normal') {
          return { ...game, normalMoves: reorder(game.normalMoves) };
        }

        if (type === 'jump') {
          return { ...game, jumpMoves: reorder(game.jumpMoves) };
        }

        return { ...game, dashMoves: reorder(game.dashMoves) };
      }),
    }));
  };

  const reorderSpecialMove = (fromIndex, toIndex) => {
    if (!selectedCharacter) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) => {
            if (character.id !== selectedCharacter.id) return character;

            const next = [...character.specialMoves];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            return { ...character, specialMoves: next };
          }),
        };
      }),
    }));
  };

  const removeSpecialMove = (moveId) => {
    if (!selectedCharacter) return;

    setData((prev) => ({
      ...prev,
      games: prev.games.map((game) => {
        if (game.id !== selectedGame.id) return game;

        return {
          ...game,
          characters: game.characters.map((character) =>
            character.id === selectedCharacter.id
              ? {
                  ...character,
                  specialMoves: character.specialMoves.filter((move) => move.id !== moveId),
                }
              : character,
          ),
        };
      }),
    }));
  };

  const exportJson = () => {
    setJsonText(JSON.stringify(data, null, 2));
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.games || !Array.isArray(parsed.games)) {
        throw new Error('Invalid data');
      }

      setData(parsed);
      setSelectedGameId(parsed.games[0]?.id ?? '');
      setSelectedCharacterId(parsed.games[0]?.characters?.[0]?.id ?? '');
    } catch (error) {
      alert('JSONの形式が正しくありません。');
    }
  };

  const tabOptions = [
    { key: 'builder', label: 'コンボビルダー' },
    { key: 'skills', label: '技登録' },
    { key: 'data', label: 'JSON' },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Combo Recipe Maker</p>
          <h1>コンボレシピ作成支援ツール</h1>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="panel sidebar">
          <section>
            <div className="section-head">
              <h2>ゲーム</h2>
            </div>
            <div className="inline-form">
              <input
                value={newGameName}
                onChange={(event) => setNewGameName(event.target.value)}
                placeholder="例: Guilty Gear"
              />
              <button type="button" onClick={createGame}>追加</button>
            </div>
            <ul className="simple-list">
              {games.map((game) => (
                <li key={game.id} className={game.id === selectedGame?.id ? 'selected' : ''}>
                  {editingGameId === game.id ? (
                    <input
                      className="inline-edit"
                      aria-label={`${game.name} の名称を編集`}
                      value={editingGameName}
                      onBlur={() => {
                        if (!editCancelledRef.current && editingGameName.trim()) {
                          renameGame(game.id, editingGameName);
                        }
                        editCancelledRef.current = false;
                        setEditingGameId('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (editingGameName.trim()) {
                            renameGame(game.id, editingGameName);
                          }
                          setEditingGameId('');
                        } else if (event.key === 'Escape') {
                          editCancelledRef.current = true;
                          setEditingGameId('');
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <button type="button" className="plain-text" onClick={() => setSelectedGameId(game.id)}>
                      {game.name}
                    </button>
                  )}
                  <button
                    type="button"
                    className="mini secondary"
                    onClick={() => {
                      setEditingGameId(game.id);
                      setEditingGameName(game.name);
                    }}
                  >
                    編集
                  </button>
                  <button type="button" className="mini danger" onClick={() => removeGame(game.id)}>
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selectedGame && (
            <section>
              <div className="section-head">
                <h2>キャラクター</h2>
              </div>
              <div className="inline-form">
                <input
                  value={newCharacterName}
                  onChange={(event) => setNewCharacterName(event.target.value)}
                  placeholder="例: Ken"
                />
                <button type="button" onClick={createCharacter}>追加</button>
              </div>
              <ul className="simple-list">
                {selectedGame.characters.map((character) => (
                  <li
                    key={character.id}
                    className={character.id === selectedCharacter?.id ? 'selected' : ''}
                  >
                    {editingCharacterId === character.id ? (
                      <input
                        className="inline-edit"
                        value={editingCharacterName}
                        onChange={(event) => setEditingCharacterName(event.target.value)}
                        onBlur={() => {
                          if (!editCancelledRef.current && editingCharacterName.trim()) {
                            renameCharacter(character.id, editingCharacterName);
                          }
                          editCancelledRef.current = false;
                          setEditingCharacterId('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            if (editingCharacterName.trim()) {
                              renameCharacter(character.id, editingCharacterName);
                            }
                            setEditingCharacterId('');
                          } else if (event.key === 'Escape') {
                            editCancelledRef.current = true;
                            setEditingCharacterId('');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="plain-text"
                        onClick={() => setSelectedCharacterId(character.id)}
                      >
                        {character.name}
                      </button>
                    )}
                    <button
                      type="button"
                      className="mini secondary"
                      onClick={() => {
                        setEditingCharacterId(character.id);
                        setEditingCharacterName(character.name);
                      }}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="mini"
                      onClick={() => copyCharacter(character.id)}
                    >
                      コピー
                    </button>
                    <button
                      type="button"
                      className="mini danger"
                      onClick={() => removeCharacter(character.id)}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <main className="panel content">
          {selectedGame ? (
            <>
              <section className="card combo-builder">
                <div className="section-head with-tabs">
                  <h2>{selectedCharacter ? `${selectedGame.name} / ${selectedCharacter.name}` : selectedGame.name}</h2>
                  <div className="tab-strip" role="tablist" aria-label="機能切り替え">
                    {tabOptions.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={activeTab === tab.key ? 'tab-button active' : 'tab-button'}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'builder' && (
                  <>
                    <div className="recipe-draft preview-only">
                      <div className="combo-preview">
                        <p>プレビュー</p>
                        <div className="combo-output">
                          {draft.length
                            ? buildComboString(draft.map((step) => ({ ...step, label: step.label || getActionLabel(step, 'name') })))
                            : 'ボタンを押してコンボを組み立ててください'}
                        </div>
                        <div className="builder-footer">
                          <button type="button" className="secondary" onClick={undoLastStep}>1つ戻す</button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              if (draft.length === 0 || window.confirm('コンボをクリアしますか？')) {
                                setDraft([]);
                              }
                            }}
                          >
                            クリア
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="action-palette">
                      {actionGroups.map((group) => (
                        <div key={group.key} className="action-group">
                          <h3>{group.title}</h3>
                          <div className="action-button-grid">
                            {group.actions.map((action) => (
                              <button
                                key={action.id}
                                type="button"
                                className="action-button"
                                onClick={() => addActionToDraft(action)}
                              >
                                {getActionLabel(action, notation)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="save-combo-row">
                      <input
                        value={comboName}
                        onChange={(event) => setComboName(event.target.value)}
                        placeholder={selectedCharacter ? 'コンボ名' : 'キャラクターを選択して保存'}
                        disabled={!selectedCharacter}
                      />
                      <button type="button" onClick={saveCombo} disabled={!selectedCharacter}>
                        保存
                      </button>
                    </div>
                    {!selectedCharacter && (
                      <div className="empty-muted">
                        キャラクターを追加してから、コンボを保存できます。
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'skills' && (
                  <div className="skills-panel">
                    <div className="two-col-grid">
                      <div>
                        <h3>通常技</h3>
                        <div className="inline-form">
                          <input
                            value={newMoveName}
                            onChange={(event) => setNewMoveName(event.target.value)}
                            placeholder="P, K, S..."
                          />
                          <select value={newMoveKind} onChange={(event) => setNewMoveKind(event.target.value)}>
                            <option value="normal">通常</option>
                            <option value="jump">ジャンプ</option>
                            <option value="dash">その他</option>
                          </select>
                          <button type="button" onClick={addMove}>追加</button>
                        </div>
                        {selectedMoveGroup.moves.length > 0 && (
                          <div key={selectedMoveGroup.type} className="move-section">
                            <p className="move-section-label">{selectedMoveGroup.label}</p>
                            <div className="list-box">
                              {selectedMoveGroup.moves.map((move, index) => (
                                <div key={move.id} className="list-row">
                                  <span className="move-name">{move.label}</span>
                                  <div className="reorder-actions">
                                    <button
                                      type="button"
                                      className="mini secondary"
                                      disabled={index === 0}
                                      onClick={() => reorderMove(selectedMoveGroup.type, index, index - 1)}
                                      aria-label="上へ"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      className="mini secondary"
                                      disabled={index === selectedMoveGroup.moves.length - 1}
                                      onClick={() => reorderMove(selectedMoveGroup.type, index, index + 1)}
                                      aria-label="下へ"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      type="button"
                                      className="mini danger"
                                      onClick={() => removeMove(selectedMoveGroup.type, move.id)}
                                    >
                                      削除
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3>必殺技</h3>
                        {!selectedCharacter ? (
                          <div className="empty-muted">
                            必殺技を登録するにはキャラクターを追加してください。
                          </div>
                        ) : (
                          <>
                            <div className="inline-form">
                              <input
                                value={newSpecialName}
                                onChange={(event) => setNewSpecialName(event.target.value)}
                                placeholder="必殺技名"
                              />
                              <button type="button" onClick={addSpecialMove}>追加</button>
                            </div>
                            <div className="list-box">
                              {selectedCharacter.specialMoves.map((move, index) => (
                                <div key={move.id} className="list-row">
                                  <span className="move-name">{move.name}</span>
                                  <div className="reorder-actions">
                                    <button
                                      type="button"
                                      className="mini secondary"
                                      disabled={index === 0}
                                      onClick={() => reorderSpecialMove(index, index - 1)}
                                      aria-label="上へ"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      className="mini secondary"
                                      disabled={index === selectedCharacter.specialMoves.length - 1}
                                      onClick={() => reorderSpecialMove(index, index + 1)}
                                      aria-label="下へ"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      type="button"
                                      className="mini danger"
                                      onClick={() => removeSpecialMove(move.id)}
                                    >
                                      削除
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <section className="card import-export">
                    <div className="section-head">
                      <h2>インポート / エクスポート</h2>
                    </div>
                    <textarea
                      value={jsonText}
                      onChange={(event) => setJsonText(event.target.value)}
                      placeholder="JSONを入力または出力できます"
                      rows={10}
                    />
                    <div className="button-row">
                      <button type="button" onClick={exportJson}>JSON出力</button>
                      <button type="button" className="secondary" onClick={importJson}>JSON読込</button>
                    </div>
                  </section>
                )}
              </section>

              {selectedCharacter && activeTab === 'builder' && (
                <section className="card">
                  <div className="section-head">
                    <h2>保存済みコンボ</h2>
                  </div>
                  <div className="combo-list">
                    {(selectedCharacter.combos || []).map((combo) => (
                      <div key={combo.id} className="combo-item">
                        <div>
                          <strong>{combo.name}</strong>
                          <p>{buildComboString(combo.steps.map((step) => ({ ...step, label: getActionLabel(step, notation) })))} </p>
                        </div>
                        <div className="combo-actions">
                          <button type="button" onClick={() => selectCombo(combo)}>編集</button>
                          <button type="button" className="danger" onClick={() => deleteCombo(combo.id)}>削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>ゲームとキャラクターを追加して、コンボを作成しましょう。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
