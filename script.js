const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

let turn = BLACK;
let board = [];
let isCpuThinking = false;

const DIRECTIONS = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
];

// むずかしいモード用の盤面評価表
const BOARD_WEIGHTS = [
    [100, -20,  10,   5,   5,  10, -20, 100],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 10,  -2,   1,   1,   1,   1,  -2,  10],
    [  5,  -2,   1,   1,   1,   1,  -2,   5],
    [  5,  -2,   1,   1,   1,   1,  -2,   5],
    [ 10,  -2,   1,   1,   1,   1,  -2,  10],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [100, -20,  10,   5,   5,  10, -20, 100]
];

// DOMの読み込みが完全に完了してから初期化
document.addEventListener("DOMContentLoaded", function () {
    initGame();
});

// ゲームの初期化
function initGame() {
    initBoard();
    drawBoard();
}

function initBoard() {
    board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));

    // 中央の初期配置
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;

    turn = BLACK;
    isCpuThinking = false;
}

function drawBoard() {
    const boardElement = document.getElementById("board");
    if (!boardElement) return;

    boardElement.innerHTML = "";

    // プレイヤー（黒）が置ける場所を取得
    const validMoves = (turn === BLACK) ? getValidMoves(BLACK) : [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";

            // マス目のクリックイベントを登録（アロー関数で確実に呼び出し）
            cell.addEventListener("click", () => {
                if (turn === BLACK && !isCpuThinking) {
                    onCellClick(r, c);
                }
            });

            // 駒またはガイドの表示
            if (board[r][c] === BLACK) {
                const disc = document.createElement("div");
                disc.className = "disc-black";
                cell.appendChild(disc);
            } else if (board[r][c] === WHITE) {
                const disc = document.createElement("div");
                disc.className = "disc-white";
                cell.appendChild(disc);
            } else if (turn === BLACK && !isCpuThinking) {
                // 置ける場所（黄色いドット）の表示
                const canPlace = validMoves.some(m => m.row === r && m.col === c);
                if (canPlace) {
                    const guide = document.createElement("div");
                    guide.className = "can-place-guide";
                    cell.appendChild(guide);
                }
            }

            boardElement.appendChild(cell);
        }
    }

    updateStatus();
}

function onCellClick(row, col) {
    // 既に駒がある場合は無視
    if (board[row][col] !== EMPTY) return;

    // ひっくり返せる駒を取得
    const flippedDiscs = getFlippedDiscs(row, col, turn);

    // 挟める駒がある場合のみ置く
    if (flippedDiscs.length > 0) {
        executeMove(row, col, flippedDiscs);
        nextTurn();
    }
}

function executeMove(row, col, flippedDiscs) {
    board[row][col] = turn;
    for (const [r, c] of flippedDiscs) {
        board[r][c] = turn;
    }
}

function nextTurn() {
    turn = (turn === BLACK) ? WHITE : BLACK;
    drawBoard();

    // 手番プレイヤーが置ける場所があるかチェック
    if (!canPlay(turn)) {
        const opponent = (turn === BLACK) ? WHITE : BLACK;
        if (!canPlay(opponent)) {
            setTimeout(showResult, 100);
            return;
        } else {
            alert((turn === BLACK ? "あなた（黒）" : "CPU（白）") + " は置ける場所がないためパスします。");
            turn = opponent;
            drawBoard();
        }
    }

    // CPUの手番（白）
    if (turn === WHITE) {
        isCpuThinking = true;
        setTimeout(playCpuTurn, 700);
    } else {
        isCpuThinking = false;
    }
}

function playCpuTurn() {
    const validMoves = getValidMoves(WHITE);
    const difficultySelect = document.getElementById("difficulty");
    const difficulty = difficultySelect ? difficultySelect.value : "easy";

    if (validMoves.length > 0) {
        let selectedMove = null;

        if (difficulty === "easy") {
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            selectedMove = validMoves[randomIndex];
        } else {
            let bestScore = -9999;
            for (const move of validMoves) {
                const score = BOARD_WEIGHTS[move.row][move.col];
                if (score > bestScore) {
                    bestScore = score;
                    selectedMove = move;
                }
            }
        }

        if (selectedMove) {
            executeMove(selectedMove.row, selectedMove.col, selectedMove.flipped);
        }
    }

    isCpuThinking = false;
    nextTurn();
}

function getValidMoves(currentTurn) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === EMPTY) {
                const flipped = getFlippedDiscs(r, c, currentTurn);
                if (flipped.length > 0) {
                    moves.push({ row: r, col: c, flipped: flipped });
                }
            }
        }
    }
    return moves;
}

function getFlippedDiscs(row, col, currentTurn) {
    const opponent = (currentTurn === BLACK) ? WHITE : BLACK;
    let discsToFlip = [];

    for (const [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let tempFlips = [];

        while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
            tempFlips.push([r, c]);
            r += dr;
            c += dc;
        }

        if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === currentTurn) {
            discsToFlip = discsToFlip.concat(tempFlips);
        }
    }

    return discsToFlip;
}

function canPlay(currentTurn) {
    return getValidMoves(currentTurn).length > 0;
}

function updateStatus() {
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === BLACK) blackCount++;
            if (board[r][c] === WHITE) whiteCount++;
        }
    }

    const turnText = (turn === BLACK) ? "あなた（黒）" : "CPU（白）";
    const statusElem = document.getElementById("status");
    if (statusElem) {
        statusElem.innerText = `手番: ${turnText} | あなた: ${blackCount}枚 - CPU: ${whiteCount}枚`;
    }
}

function showResult() {
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === BLACK) blackCount++;
            if (board[r][c] === WHITE) whiteCount++;
        }
    }

    let message = `ゲーム終了！\nあなた: ${blackCount}枚\nCPU: ${whiteCount}枚\n`;
    if (blackCount > whiteCount) {
        message += "あなたの勝ちです！🎉";
    } else if (whiteCount > blackCount) {
        message += "CPUの勝ちです！";
    } else {
        message += "引き分けです！";
    }

    alert(message);
}