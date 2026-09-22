import { Game } from '../types/game';
import { ticTacToeGame } from './tic-tac-toe';
import { minesweeperGame } from './minesweeper';
import { glassBridgeGame } from './glass-bridge';

export const ALL_GAMES: Game[] = [
  ticTacToeGame,
  minesweeperGame,
  glassBridgeGame,
];

export function getGameById(id: string): Game | undefined {
  return ALL_GAMES.find((g) => g.id === id);
}
