import { JevDecision } from '../types/game';

const API_BASE = 'https://can-you-beat-jev.vercel.app/api';

function optimalTicTacToeMoves(board: string[], turn = 'O'): number[] {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const opponent = turn === 'O' ? 'X' : 'O';
  const memo = new Map<string, number>();

  const outcome = (position: string[]): number => {
    const key = position.join('|');
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    for (const [a, b, c] of lines) {
      if (position[a] && position[a] === position[b] && position[a] === position[c]) {
        const result = position[a] === turn ? 1 : -1;
        memo.set(key, result);
        return result;
      }
    }
    if (position.every(Boolean)) {
      memo.set(key, 0);
      return 0;
    }
    const nextPlayer = position.filter((cell) => cell === turn).length >
      position.filter((cell) => cell === opponent).length ? opponent : turn;
    const scores: number[] = [];
    position.forEach((cell, index) => {
      if (cell) return;
      const next = [...position];
      next[index] = nextPlayer;
      scores.push(outcome(next));
    });
    const result = nextPlayer === turn ? Math.max(...scores) : Math.min(...scores);
    memo.set(key, result);
    return result;
  };

  const scored = board.map((cell, index) => {
    if (cell) return null;
    const next = [...board];
    next[index] = turn;
    return { index, score: outcome(next) };
  }).filter((move): move is { index: number; score: number } => move !== null);
  if (!scored.length) return [];
  const best = Math.max(...scored.map((move) => move.score));
  return scored.filter((move) => move.score === best).map((move) => move.index);
}

export async function fetchJevMove(
  gameId: string,
  gameState: Record<string, any>,
  validActions: any[],
  difficulty: string = 'standard',
  instructions?: string
): Promise<JevDecision> {
  try {
    const res = await fetch(`${API_BASE}/jev/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: gameId,
        game_state: gameState,
        valid_actions: validActions,
        difficulty,
        instructions,
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data as JevDecision;
  } catch (error) {
    console.warn('API move request failed, using client fallback', error);
    // Instant client-side fallback guarantee
    const fallbackAction = gameId === 'tic-tac-toe'
      ? optimalTicTacToeMoves(gameState.board || Array(9).fill(''), 'O')
        .find((move) => validActions.map(Number).includes(move)) ?? validActions[0]
      : validActions[Math.floor(Math.random() * validActions.length)];
    return {
      action: fallbackAction,
      confidence: 0.65,
      probabilities: { [String(fallbackAction)]: 0.65 },
      commentary: "My neural link fluttered, but my move is made.",
      expression: 'smug',
      model: 'jev-local-safeguard',
      latency_ms: 120,
    };
  }
}

export async function fetchJevTaunt(
  event: 'game_start' | 'blunder' | 'player_ahead' | 'jev_ahead' | 'human_win' | 'jev_win' | 'poke',
  gameId: string,
  playerName: string = 'Human'
): Promise<{ taunt: string; expression: string }> {
  try {
    const res = await fetch(`${API_BASE}/jev/taunt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, game_id: gameId, player_name: playerName }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback
  }

  const defaultTaunts: Record<string, [string, string]> = {
    game_start: ["Ready to challenge System One? Let's see your moves.", "confident"],
    blunder: ["Are you sure about that move, human?", "smug"],
    player_ahead: ["Interesting... recomputing alternative branches.", "thinking"],
    jev_ahead: ["My victory probability is climbing rapidly.", "evil_laugh"],
    human_win: ["A temporary aberration in probability. Well played.", "glitching"],
    jev_win: ["Another win for synthetic cognition. Gg!", "evil_laugh"],
    poke: ["Hey, don't interrupt my tensor cores!", "smug"],
  };

  const [t, expr] = defaultTaunts[event] || defaultTaunts.game_start;
  return { taunt: t, expression: expr };
}
