document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // CONSTANTS
  // =========================
  const Players = { X: "X", O: "O" };
  const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const soundEffects = {
    click: new Audio("sounds/ting.mp3"),       // play when a move is made
    win: new Audio("sounds/gameover.mp3"),     // play when someone wins
    draw: [                                    // array of draw sounds
      new Audio("sounds/aww.mp3"),
      new Audio("sounds/thudsound.mp3")
    ]
  };

  // Play move sound
  function playMoveSound() {
    soundEffects.click.currentTime = 0;
    soundEffects.click.play();
  }

  // Play win sound
  function playWinSound() {
    soundEffects.win.currentTime = 0;
    soundEffects.win.play();
  }

  // Play random draw sound
  function playDrawSound() {
    const sounds = soundEffects.draw;
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    randomSound.currentTime = 0;
    randomSound.play();
  }



  // =========================
  // DOM ELEMENTS
  // =========================
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const modeScreen = document.getElementById("modeScreen");
  const gameScreen = document.getElementById("gameScreen");
  const resetBtn = document.getElementById("reset");
  const resetScoresBtn = document.getElementById("resetScores");
  const backBtn = document.getElementById("back");
  const winLine = document.getElementById("winLine");
  const scoreXEl = document.getElementById("scoreX");
  const scoreOEl = document.getElementById("scoreO");
  const titleEl = document.getElementById("gameTitle");

  const winSound = new Audio("sounds/gameover.mp3"); // optional sound

  // =========================
  // GAME STATE
  // =========================
  const Game = {
    board: Array(9).fill(""),
    turn: Players.X,
    mode: null, // "ai" or "two"
    active: false,
    score: {
      X: Number(localStorage.getItem("scoreX")) || 0,
      O: Number(localStorage.getItem("scoreO")) || 0
    }
  };

  // =========================
  // INIT
  // =========================
  createBoard();
  updateScoreUI();
  updateStatus();

  // =========================
  // BOARD CREATION
  // =========================
  function createBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("button");
      cell.dataset.index = i;
      cell.className = `
        flex items-center justify-center
        text-5xl sm:text-6xl font-bold rounded-xl
        bg-[#111a2e] border border-blue-900/40
        hover:bg-blue-500/10 text-blue-400
        transition aspect-square
      `;
      boardEl.appendChild(cell);
    }
  }

  // =========================
  // EVENT HANDLERS
  // =========================
  // Cell click
  boardEl.addEventListener("click", handleMove);

  // Mode selection
  modeScreen.addEventListener("click", e => {
    if (!e.target.dataset.mode) return;
    Game.mode = e.target.dataset.mode;
    startGame();
    animateTitleHighlight();
  });

  // Back to mode selection
  backBtn.addEventListener("click", () => {
    gameScreen.classList.add("hidden");
    modeScreen.classList.remove("hidden");
    animateTitleHighlight();
  });

  // Reset / restart buttons
  resetBtn.addEventListener("click", resetGame);
  resetScoresBtn.addEventListener("click", resetScores);

  // =========================
  // GAME CONTROL FUNCTIONS
  // =========================
  function startGame() {
    modeScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    resetGame();
  }

  function resetGame() {
    Game.board.fill("");
    Game.turn = Players.X;
    Game.active = true;
    winLine.style.opacity = "0";

    document.querySelectorAll("[data-index]").forEach(c => {
      c.textContent = "";
      c.classList.remove("cell-pop", "win", "draw");
    });

    updateStatus();
  }

  function resetScores() {
    Game.score.X = 0;
    Game.score.O = 0;
    localStorage.removeItem("scoreX");
    localStorage.removeItem("scoreO");
    updateScoreUI();
  }

  // =========================
  // PLAYER MOVE
  // =========================
  function handleMove(e) {
    const idx = e.target.dataset.index;
    if (idx === undefined || !Game.active || Game.board[idx]) return;

    makeMove(idx, Game.turn);

    if (checkGameEnd()) return;

    switchTurn();

    // AI move
    if (Game.mode === "ai" && Game.turn === Players.O) {
      Game.active = false;
      setTimeout(aiMove, 400);
    }
  }

  function makeMove(idx, player) {
    Game.board[idx] = player;
    const cell = document.querySelector(`[data-index='${idx}']`);
    cell.textContent = player;
    cell.classList.add("cell-pop");

    // Play move sound
    playMoveSound();
  }

  function switchTurn() {
    Game.turn = Game.turn === Players.X ? Players.O : Players.X;
    updateStatus();
  }

  // =========================
  // STATUS & SCORE
  // =========================
  function updateStatus(text) {
    statusEl.textContent = text || `${Game.turn}'s Turn`;
  }

  function updateScoreUI() {
    scoreXEl.textContent = Game.score.X;
    scoreOEl.textContent = Game.score.O;
  }

  function saveScores() {
    localStorage.setItem("scoreX", Game.score.X);
    localStorage.setItem("scoreO", Game.score.O);
  }

  // =========================
  // WIN / DRAW LOGIC
  // =========================
  function checkGameEnd() {
    const result = getWinner(Game.board);

    if (result) {
      // WIN
      Game.active = false;
      Game.score[result.player]++;
      saveScores();
      updateScoreUI();
      drawWinLine(result.pattern);
      highlightWinner(result.pattern);

      // Play win sound
      playWinSound();


      updateStatus(`${result.player} Wins!`);
      return true;
    }

    if (!Game.board.includes("")) {
      // DRAW
      Game.active = false;
      document.querySelectorAll("[data-index]").forEach(c => c.classList.add("draw"));
      winLine.style.opacity = "0";
      // Play random draw sound
      playDrawSound();
      updateStatus("Draw! No points awarded.");
      return true;
    }

    return false;
  }

  function getWinner(board) {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], pattern };
      }
    }
    return null;
  }

  function highlightWinner(pattern) {
    pattern.forEach(idx => {
      document.querySelector(`[data-index='${idx}']`).classList.add("win");
    });
  }

  function drawWinLine(pattern) {
    const first = document.querySelector(`[data-index='${pattern[0]}']`);
    const last = document.querySelector(`[data-index='${pattern[2]}']`);
    const boardRect = boardEl.getBoundingClientRect();
    const r1 = first.getBoundingClientRect();
    const r2 = last.getBoundingClientRect();

    const x1 = r1.left + r1.width / 2 - boardRect.left;
    const y1 = r1.top + r1.height / 2 - boardRect.top;
    const x2 = r2.left + r2.width / 2 - boardRect.left;
    const y2 = r2.top + r2.height / 2 - boardRect.top;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    winLine.style.width = `${length}px`;
    winLine.style.height = "5px";
    winLine.style.transform = `translate(${x1}px,${y1}px) rotate(${angle}deg)`;
    winLine.style.transformOrigin = "0 50%";
    winLine.style.opacity = "1";
  }

  // =========================
  // AI MINIMAX
  // =========================
  function aiMove() {
    const move = minimax([...Game.board], Players.O);
    if (move.idx !== undefined) makeMove(move.idx, Players.O);

    if (!checkGameEnd()) {
      Game.active = true;
      switchTurn();
    }
  }

  function minimax(board, player) {
    const winner = getWinner(board);
    if (winner?.player === Players.O) return { score: 10 };
    if (winner?.player === Players.X) return { score: -10 };
    if (!board.includes("")) return { score: 0 };

    const moves = [];

    board.forEach((cell, idx) => {
      if (!cell) {
        board[idx] = player;
        const result = minimax(board, player === Players.O ? Players.X : Players.O);
        moves.push({ idx, score: result.score });
        board[idx] = "";
      }
    });

    return player === Players.O
      ? moves.reduce((a, b) => a.score > b.score ? a : b)
      : moves.reduce((a, b) => a.score < b.score ? a : b);
  }

  // =========================
  // TITLE HIGHLIGHT ANIMATION
  // =========================
  function animateTitleHighlight() {
    titleEl.classList.remove("active-mode");
    void titleEl.offsetWidth; // trigger reflow
    titleEl.classList.add("active-mode");
  }

});
