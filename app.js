const SIZE = 10, CELL = 40, LEFT = 60, TOP = 20;
const COLORS = { blue: { fill: '#638fda', edge: '#386ac0', name: '蓝色' } };
const board = Array(SIZE * SIZE).fill(null);
const $ = id => document.getElementById(id);
let questionCount = 0;

function neighbors(index) {
  const row = Math.floor(index / SIZE), col = index % SIZE;
  return [
    row > 0 ? index - SIZE : -1,
    row < SIZE - 1 ? index + SIZE : -1,
    col > 0 ? index - 1 : -1,
    col < SIZE - 1 ? index + 1 : -1
  ].filter(i => i >= 0);
}

function growShape(color, minCol, maxCol, target) {
  const row = 2 + Math.floor(Math.random() * 6);
  const col = minCol + 1 + Math.floor(Math.random() * Math.max(1, maxCol - minCol - 1));
  const occupied = new Set([row * SIZE + col]);
  board[row * SIZE + col] = color;
  while (occupied.size < target) {
    const choices = [...occupied].flatMap(neighbors).filter(index => {
      const c = index % SIZE;
      return c >= minCol && c <= maxCol && board[index] === null;
    });
    if (!choices.length) break;
    const next = choices[Math.floor(Math.random() * choices.length)];
    occupied.add(next);
    board[next] = color;
  }
}

function generateBoard() {
  board.fill(null);
  growShape('blue', 0, 9, 20 + Math.floor(Math.random() * 11));
  renderBoard();
  newQuestion();
}

const count = color => board.filter(cell => cell === color).length;

function renderBoard() {
  let svg = '<rect x="0" y="0" width="520" height="440" fill="#fff"/>';
  board.forEach((color, index) => {
    if (!color) return;
    const x = LEFT + (index % SIZE) * CELL;
    const y = TOP + Math.floor(index / SIZE) * CELL;
    svg += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${COLORS[color].fill}"/>`;
  });
  for (let i = 0; i <= SIZE; i++) {
    const x = LEFT + i * CELL, y = TOP + i * CELL;
    svg += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + SIZE * CELL}" stroke="#87918f" stroke-width="${i === 0 || i === SIZE ? 1.8 : 1}" opacity=".8"/>`;
    svg += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + SIZE * CELL}" y2="${y}" stroke="#87918f" stroke-width="${i === 0 || i === SIZE ? 1.8 : 1}" opacity=".8"/>`;
  }
  board.forEach((color, index) => {
    if (!color) return;
    const x = LEFT + (index % SIZE) * CELL, y = TOP + Math.floor(index / SIZE) * CELL;
    const row = Math.floor(index / SIZE), col = index % SIZE;
    const edges = [
      [row === 0 || board[index - SIZE] !== color, x, y, x + CELL, y],
      [col === SIZE - 1 || board[index + 1] !== color, x + CELL, y, x + CELL, y + CELL],
      [row === SIZE - 1 || board[index + SIZE] !== color, x, y + CELL, x + CELL, y + CELL],
      [col === 0 || board[index - 1] !== color, x, y, x, y + CELL]
    ];
    edges.forEach(([show, x1, y1, x2, y2]) => {
      if (show) svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS[color].edge}" stroke-width="2.6" stroke-linecap="square"/>`;
    });
  });
  board.forEach((color, index) => {
    const x = LEFT + (index % SIZE) * CELL, y = TOP + Math.floor(index / SIZE) * CELL;
    svg += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="transparent" data-index="${index}" tabindex="0" role="button" aria-label="第 ${Math.floor(index / SIZE) + 1} 行第 ${index % SIZE + 1} 列，${color ? COLORS[color].name : '空白'}方格"/>`;
  });
  $('shape-canvas').innerHTML = svg;
  const blue = count('blue');
  $('blue-count').textContent = blue;
  $('total-count').textContent = `${blue} cm²`;
  $('calculation-text').textContent = `${blue} 个小方格 × 1 cm² = ${blue} cm²`;
  $('shape-canvas').setAttribute('aria-label', `10 乘 10 方格纸，共 100 格。蓝色图形 ${blue} 格，面积 ${blue} 平方厘米。点击方格可以涂色。`);
}

function cycleCell(index) {
  board[index] = board[index] === null ? 'blue' : null;
  renderBoard();
  $('answer-feedback').textContent = '图形变了，再数一数吧！';
  $('answer-feedback').className = 'feedback';
}

$('shape-canvas').addEventListener('click', event => {
  const index = event.target.dataset.index;
  if (index !== undefined) cycleCell(Number(index));
});
$('shape-canvas').addEventListener('keydown', event => {
  const index = event.target.dataset.index;
  if (index === undefined || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  cycleCell(Number(index));
  $('shape-canvas').querySelector(`[data-index="${index}"]`).focus();
});
$('regenerate-button').addEventListener('click', generateBoard);

function newQuestion() {
  questionCount++;
  $('question-number').textContent = `${String(questionCount).padStart(2, '0')} / ∞`;
  $('question-icon').textContent = '■';
  $('question-icon').style.color = COLORS.blue.fill;
  $('question-text').textContent = '蓝色图形的面积是多少 cm²？';
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手数数看吧！';
  $('answer-feedback').className = 'feedback';
}

function checkAnswer() {
  const input = $('answer-input').value.trim();
  const feedback = $('answer-feedback');
  if (!input) { feedback.textContent = '先输入你的答案。'; feedback.className = 'feedback incorrect'; return; }
  const answer = count('blue');
  const correct = Number(input) === answer;
  feedback.textContent = correct ? `答对了！${answer} 个方格 × 1 cm² = ${answer} cm²。` : '再数一数涂色的完整小方格，每格是 1 cm²。';
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('new-question').addEventListener('click', generateBoard);
$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
generateBoard();
