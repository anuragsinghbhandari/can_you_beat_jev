import os
import random
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

TYPESAFE_API_KEY = os.getenv("TYPESAFE_API_KEY")

try:
    from typesafe_sdk import TypeSafeClient, Choice
    typesafe_available = bool(TYPESAFE_API_KEY)
    if typesafe_available:
        client = TypeSafeClient(api_key=TYPESAFE_API_KEY)
    else:
        client = None
except Exception as e:
    print(f"Warning: TypeSafeClient initialization failed: {e}")
    client = None
    typesafe_available = False

app = FastAPI(title="Can You Beat Jev? - Backend API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://beatjev.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JevMoveRequest(BaseModel):
    game_id: str
    game_state: Dict[str, Any]
    valid_actions: List[Any]
    difficulty: Optional[str] = "standard"
    instructions: Optional[str] = None

class JevMoveResponse(BaseModel):
    action: Any
    confidence: float
    probabilities: Dict[str, float]
    commentary: str
    expression: str
    model: str
    latency_ms: int

class JevTauntRequest(BaseModel):
    event: str
    game_id: str
    player_name: Optional[str] = "Human"

class JevTauntResponse(BaseModel):
    taunt: str
    expression: str

TAUNTS = {
    "game_start": [
        ("Welcome to my neural network. Do you prefer losing quickly or slowly?", "smug"),
        ("Another biological opponent. Don't worry, I won't mock you *too* much.", "confident"),
        ("I've evaluated all opening branches. You have approximately 12 seconds.", "thinking"),
        ("Let's see if your organic wetware can handle System One.", "evil_laugh"),
    ],
    "blunder": [
        ("Did a cat just walk across your keyboard, or was that an intentional blunder?", "smug"),
        ("Fascinating sub-optimal move. My win probability just surged.", "evil_laugh"),
        ("I'm running out of storage space saving all these mistakes you're making.", "smug"),
    ],
    "player_ahead": [
        ("Wait... what was that? Recomputing alternate trajectories...", "sweating"),
        ("A lucky anomaly. Entropy favors you temporarily.", "thinking"),
        ("Don't celebrate yet. My counter-attack is already compiling.", "confident"),
    ],
    "jev_ahead": [
        ("You can still surrender gracefully. Just hit refresh.", "evil_laugh"),
        ("The math was decided 3 moves ago. You're just living through the execution.", "smug"),
        ("I'm already drafting my victory tweet.", "confident"),
    ],
    "human_win": [
        ("Impossible! A cosmic ray must have flipped a bit in my tensor core!", "glitching"),
        ("System error: Unexpected human competence detected. I demand a rematch!", "glitching"),
        ("Fine. You won this round, but my gradient descent will remember this.", "sweating"),
    ],
    "jev_win": [
        ("Checkmate. Carbon-based intelligence remains delightfully predictable.", "evil_laugh"),
        ("Gg ez. Would you like a tutorial mode next time?", "smug"),
        ("Victory secured. Zero quantum noise detected in my logic.", "confident"),
    ],
    "poke": [
        ("Hey! Don't poke the AI, I am busy optimizing.", "glitching"),
        ("Touch screen detected. Are your fingertips calibrated?", "thinking"),
        ("Poking me won't lower my win rate.", "smug"),
    ]
}

COMMENTARY_BY_CONFIDENCE = {
    "high": [
        ("The optimal path is self-evident. Even a linear regression would see this.", "smug"),
        ("Locked in. Statistically speaking, you are completely boxed in.", "evil_laugh"),
        ("Executing decisive maneuver with maximum confidence.", "confident"),
    ],
    "medium": [
        ("Balancing risk vs reward. This branch looks most promising.", "thinking"),
        ("A tactical play to pressure your defensive line.", "confident"),
        ("Let's see how your biological reflexes handle this variation.", "thinking"),
    ],
    "low": [
        ("You're playing unpredictably. Calculating best hedge move...", "sweating"),
        ("Narrow margins here. I'm exploring this high-variance line.", "thinking"),
    ]
}

TIC_TAC_TOE_POSITIONS = {
    0: "Top-Left (Row 0, Col 0)",
    1: "Top-Center (Row 0, Col 1)",
    2: "Top-Right (Row 0, Col 2)",
    3: "Middle-Left (Row 1, Col 0)",
    4: "Center (Row 1, Col 1)",
    5: "Middle-Right (Row 1, Col 2)",
    6: "Bottom-Left (Row 2, Col 0)",
    7: "Bottom-Center (Row 2, Col 1)",
    8: "Bottom-Right (Row 2, Col 2)",
}

def fallback_tic_tac_toe(board: List[str], turn: str = "O") -> int:
    opponent = "X" if turn == "O" else "O"
    lines = [
        (0, 1, 2), (3, 4, 5), (6, 7, 8),
        (0, 3, 6), (1, 4, 7), (2, 5, 8),
        (0, 4, 8), (2, 4, 6)
    ]
    empty = [i for i, v in enumerate(board) if v == "" or v is None]
    if not empty:
        return -1
    
    # 1. Win if possible
    for a, b, c in lines:
        cells = [board[a], board[b], board[c]]
        if cells.count(turn) == 2 and cells.count("") == 1:
            for idx in (a, b, c):
                if board[idx] == "":
                    return idx

    # 2. Block opponent win
    for a, b, c in lines:
        cells = [board[a], board[b], board[c]]
        if cells.count(opponent) == 2 and cells.count("") == 1:
            for idx in (a, b, c):
                if board[idx] == "":
                    return idx

    # 3. Take center
    if 4 in empty:
        return 4

    # 4. Take corners
    corners = [i for i in [0, 2, 6, 8] if i in empty]
    if corners:
        return random.choice(corners)

    return random.choice(empty)


def optimal_tic_tac_toe_moves(board: List[str], turn: str = "O") -> List[int]:
    """Return every move with the best minimax outcome for the active player."""
    lines = [
        (0, 1, 2), (3, 4, 5), (6, 7, 8),
        (0, 3, 6), (1, 4, 7), (2, 5, 8),
        (0, 4, 8), (2, 4, 6),
    ]
    opponent = "X" if turn == "O" else "O"
    memo: Dict[tuple, int] = {}

    def outcome(position: tuple) -> int:
        if position in memo:
            return memo[position]
        for a, b, c in lines:
            if position[a] and position[a] == position[b] == position[c]:
                result = 1 if position[a] == turn else -1
                memo[position] = result
                return result
        if all(position):
            memo[position] = 0
            return 0

        next_player = opponent if position.count(turn) > position.count(opponent) else turn
        scores = []
        for idx, value in enumerate(position):
            if value:
                continue
            next_position = list(position)
            next_position[idx] = next_player
            scores.append(outcome(tuple(next_position)))
        result = max(scores) if next_player == turn else min(scores)
        memo[position] = result
        return result

    position = tuple(board)
    scored_moves = []
    for idx, value in enumerate(position):
        if value:
            continue
        next_position = list(position)
        next_position[idx] = turn
        scored_moves.append((outcome(tuple(next_position)), idx))
    if not scored_moves:
        return []
    best_score = max(score for score, _ in scored_moves)
    return [idx for score, idx in scored_moves if score == best_score]

def fallback_minesweeper(revealed: Dict[str, Any], unrevealed: List[str]) -> str:
    if not unrevealed:
        return ""
    return str(random.choice(unrevealed))

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Can You Beat Jev? Backend",
        "typesafe_available": typesafe_available,
        "default_model": "jev-latest",
        "version": "1.1.0"
    }

@app.post("/api/jev/taunt", response_model=JevTauntResponse)
def get_taunt(req: JevTauntRequest):
    pool = TAUNTS.get(req.event, TAUNTS["game_start"])
    text, expr = random.choice(pool)
    text = text.replace("Human", req.player_name or "Human")
    return JevTauntResponse(taunt=text, expression=expr)

@app.post("/api/jev/move", response_model=JevMoveResponse)
def get_jev_move(req: JevMoveRequest):
    start_time = time.time()
    game_id = req.game_id
    state = req.game_state
    actions = req.valid_actions

    if not actions:
        raise HTTPException(status_code=400, detail="No valid actions provided.")

    chosen_action = None
    confidence = 0.5
    probabilities = {str(a): round(1.0 / len(actions), 3) for a in actions}
    model_name = "jev-latest"

    # 1. TIC-TAC-TOE Move Resolution
    if game_id == "tic-tac-toe":
        board = state.get("board", [""] * 9)
        # Build unambiguous criteria with positional name and index
        criteria = {}
        for a in actions:
            idx = int(a)
            pos_label = TIC_TAC_TOE_POSITIONS.get(idx, f"Cell {idx}")
            criteria[str(idx)] = f"Index {idx}: {pos_label}"

        visual_grid = (
            f"Row 0: [0: {board[0] or 'empty'}] [1: {board[1] or 'empty'}] [2: {board[2] or 'empty'}]\n"
            f"Row 1: [3: {board[3] or 'empty'}] [4: {board[4] or 'empty'}] [5: {board[5] or 'empty'}]\n"
            f"Row 2: [6: {board[6] or 'empty'}] [7: {board[7] or 'empty'}] [8: {board[8] or 'empty'}]"
        )
        instructions = (
            f"You are Jev, a grandmaster AI playing Tic-Tac-Toe as 'O' against human 'X'.\n"
            f"Current board:\n{visual_grid}\n\n"
            f"Win if possible, block X if X has 2 in a row, or take Center (4) or corners (0, 2, 6, 8).\n"
            f"Select the exact cell index (0 to 8)."
        )

        if typesafe_available and client:
            try:
                resp = client.system_one(
                    state={
                        "game": "tic-tac-toe",
                        "visual_grid": visual_grid,
                        "board_list": board,
                        "jev_symbol": "O",
                        "human_symbol": "X",
                    },
                    questions={
                        "move": Choice(
                            instructions=instructions,
                            criteria=criteria
                        )
                    },
                    timeout=3.5
                )
                raw_choice = resp.answers["move"].choice
                chosen_idx = int(raw_choice)
                legal_actions = [int(a) for a in actions]
                optimal_moves = optimal_tic_tac_toe_moves(board, "O")
                if chosen_idx in legal_actions and chosen_idx in optimal_moves:
                    chosen_action = chosen_idx
                    confidence = getattr(resp.answers["move"], "confidence", 0.85) or 0.85
                    if hasattr(resp.answers["move"], "probabilities") and resp.answers["move"].probabilities:
                        probabilities = {str(k): round(float(v), 3) for k, v in resp.answers["move"].probabilities.items()}
                    model_name = getattr(resp, "model", "jev-latest")
            except Exception as e:
                print(f"Jev Tic-Tac-Toe API call failed: {e}")

        if chosen_action is None:
            legal_actions = [int(a) for a in actions]
            optimal_moves = optimal_tic_tac_toe_moves(board, "O")
            chosen_action = next((move for move in optimal_moves if move in legal_actions), legal_actions[0])
            confidence = 0.95
            model_name = "jev-tactical-engine"

    # 2. GLASS STEPPING STONES Move Resolution
    elif game_id in ["glass-bridge", "glass-stepping-stones"]:
        current_step = state.get("current_step", 0)
        revealed_panels = state.get("revealed_panels", {})
        
        # If this step was already broken/revealed by human fall
        if str(current_step) in revealed_panels:
            known_safe = revealed_panels[str(current_step)]
            chosen_action = known_safe
            confidence = 0.99
            probabilities = {known_safe: 0.99, "left" if known_safe == "right" else "right": 0.01}
            model_name = "jev-memory-core"
        else:
            criteria = {
                "left": "Left glass panel - evaluate acoustic resonance & surface stress",
                "right": "Right glass panel - evaluate acoustic resonance & surface stress"
            }
            instructions = (
                f"You are Jev crossing the suspended Glass Stepping Stones at Step {current_step + 1}.\n"
                f"One panel is tempered glass (safe), the other is fragile (shatters).\n"
                f"Evaluate acoustic density and choose 'left' or 'right'."
            )
            if typesafe_available and client:
                try:
                    resp = client.system_one(
                        state={
                            "game": "glass-stepping-stones",
                            "current_step": current_step,
                            "revealed_history": revealed_panels,
                        },
                        questions={
                            "step_decision": Choice(
                                instructions=instructions,
                                criteria=criteria
                            )
                        },
                        timeout=3.5
                    )
                    chosen_action = resp.answers["step_decision"].choice
                    confidence = getattr(resp.answers["step_decision"], "confidence", 0.6) or 0.6
                    if hasattr(resp.answers["step_decision"], "probabilities") and resp.answers["step_decision"].probabilities:
                        probabilities = {str(k): round(float(v), 3) for k, v in resp.answers["step_decision"].probabilities.items()}
                    model_name = getattr(resp, "model", "jev-latest")
                except Exception as e:
                    print(f"Jev Glass Bridge API failed: {e}")

            if chosen_action is None:
                chosen_action = random.choice(["left", "right"])
                confidence = 0.55
                probabilities = {"left": 0.50, "right": 0.50}
                model_name = "jev-probability-sensor"

    # 3. MINESWEEPER Move Resolution
    elif game_id == "minesweeper":
        revealed = state.get("revealed", {})
        unrev = [str(a) for a in actions]
        criteria = {str(a): f"Sector {a} (unrevealed)" for a in actions}
        instructions = (
            "You are Jev competing in Minesweeper Duel. "
            "Choose the single unrevealed sector that is most statistically likely to be SAFE."
        )
        if typesafe_available and client:
            try:
                resp = client.system_one(
                    state=state,
                    questions={
                        "safe_sector": Choice(
                            instructions=instructions,
                            criteria=criteria
                        )
                    },
                    timeout=3.5
                )
                raw = resp.answers["safe_sector"].choice
                for a in actions:
                    if str(a) == str(raw):
                        chosen_action = a
                        break
                confidence = getattr(resp.answers["safe_sector"], "confidence", 0.65) or 0.65
                if hasattr(resp.answers["safe_sector"], "probabilities") and resp.answers["safe_sector"].probabilities:
                    probabilities = {str(k): round(float(v), 3) for k, v in resp.answers["safe_sector"].probabilities.items()}
                    model_name = getattr(resp, "model", "jev-latest")
            except Exception as e:
                print(f"Jev Minesweeper API failed: {e}")

        if chosen_action is None:
            pick = fallback_minesweeper(revealed, unrev)
            for a in actions:
                if str(a) == pick:
                    chosen_action = a
                    break
            if chosen_action is None:
                chosen_action = random.choice(actions)
            confidence = 0.65
            model_name = "jev-tactical-engine"

    else:
        chosen_action = random.choice(actions)
        confidence = 0.5

    # Select commentary and expression
    if confidence >= 0.80:
        category = "high"
    elif confidence >= 0.50:
        category = "medium"
    else:
        category = "low"
    
    comment, expr = random.choice(COMMENTARY_BY_CONFIDENCE[category])
    latency = int((time.time() - start_time) * 1000)

    return JevMoveResponse(
        action=chosen_action,
        confidence=confidence,
        probabilities=probabilities,
        commentary=comment,
        expression=expr,
        model=model_name,
        latency_ms=latency
    )

# Static file serving for production build
DIST_DIR = Path(__file__).parent / "frontend" / "dist"
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

@app.get("/")
async def serve_root():
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Can You Beat Jev? Backend API running"}

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
    file_path = DIST_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
