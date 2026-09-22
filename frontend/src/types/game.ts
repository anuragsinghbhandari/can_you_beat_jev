export type GameDifficulty = 'Casual' | 'Tactical' | 'Hardcore';

export interface GameResult {
  finished: boolean;
  winner: 'human' | 'jev' | 'draw' | null;
  reason: string;
  score?: {
    human: number;
    jev: number;
  };
  movesCount: number;
  summaryDetails?: string;
  shareableSummary?: string;
}

export interface JevDecision {
  action: any;
  confidence: number;
  probabilities: Record<string, number>;
  commentary: string;
  expression: 'smug' | 'thinking' | 'sweating' | 'evil_laugh' | 'glitching' | 'confident';
  model: string;
  latency_ms: number;
}

export interface Game<TState = any, TAction = any> {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: GameDifficulty;
  estimatedTime: string;
  iconName: string;
  colorAccent: string; // Tailwind color or hex

  initialize(options?: any): TState;

  getValidActions(state: TState): TAction[];

  applyAction(state: TState, action: TAction, player: 'human' | 'jev'): TState;

  isFinished(state: TState): boolean;

  getResult(state: TState): GameResult;

  formatStateForJev(state: TState): {
    game_state: Record<string, any>;
    valid_actions: any[];
    instructions?: string;
  };

  // Optional custom UI component for rendering the game board
  renderBoard(props: {
    state: TState;
    onPlayerAction: (action: TAction) => void;
    isHumanTurn: boolean;
    isThinking: boolean;
    lastJevDecision: JevDecision | null;
  }): React.ReactNode;
}
