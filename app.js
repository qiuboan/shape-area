const SIZE = 10, CELL = 40, LEFT = 60, TOP = 20;
const BLUE = '#638fda', BLUE_DARK = '#386ac0';
const $ = id => document.getElementById(id);
const LEVELS = [
  { name: '热身', min: 5, max: 7, moves: [false] },
  { name: '进阶', min: 8, max: 11, moves: [true] },
  { name: '挑战', min: 12, max: 16, moves: [false, true] },
  { name: '高手', min: 17, max: 22, moves: [false, true, false] },
  { name: '终极挑战', min: 23, max: 29, moves: [false, true, false, true] }
];
let full = new Set(), pairs = [], progress = 0, animation = null, level = 1;

function rowOf(index) { return Math.floor(index / SIZE); }
function colOf(index) { return index % SIZE; }
function neighbors(index) {
  const r = rowOf(index), c = colOf(index);
  return [
    r > 0 ? index - SIZE : -1,
    r < SIZE - 1 ? index + SIZE : -1,
    c > 0 ? index - 1 : -1,
    c < SIZE - 1 ? index + 1 : -1
  ].filter(i => i >= 0);
}
function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }

function growFull(target) {
  full = new Set([44]);
  while (full.size < target) {
    const choices = [...full].flatMap(neighbors).filter(index => {
      const r = rowOf(index), c = colOf(index);
      return r >= 1 && r <= 8 && c >= 1 && c <= 8 && !full.has(index);
    });
    if (!choices.length) return false;
    full.add(randomItem(choices));
  }
  return true;
}

function choosePairs(moves) {
  const empty = Array.from({ length: 100 }, (_, i) => i).filter(i => !full.has(i));
  const touchesTopOrLeft = i => (rowOf(i) > 0 && full.has(i - SIZE)) || (colOf(i) > 0 && full.has(i - 1));
  const touchesBottomOrRight = i => (rowOf(i) < 9 && full.has(i + SIZE)) || (colOf(i) < 9 && full.has(i + 1));
  const tl = empty.filter(touchesTopOrLeft);
  const br = empty.filter(touchesBottomOrRight);
  const used = new Set();
  const pick = candidates => {
    const options = candidates.filter(i => !used.has(i));
    if (!options.length) return null;
    const selected = randomItem(options);
    used.add(selected);
    return selected;
  };
  const selected = [];
  for (const rotate of moves) {
    const anchor = pick(tl), mover = pick(rotate ? tl : br);
    if (anchor === null || mover === null) return false;
    selected.push({ anchor, mover, rotate });
  }
  pairs = selected;
  return true;
}

function stopAnimation() {
  if (animation !== null) cancelAnimationFrame(animation);
  animation = null;
  $('play-button').textContent = '▶ 播放';
}

function generateBoard() {
  stopAnimation();
  progress = 0;
  $('motion-progress').value = 0;
  const spec = LEVELS[level - 1];
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
    if (growFull(target) && choosePairs(spec.moves)) {
      renderBoard();
      newQuestion();
      return;
    }
  }
  throw new Error('无法生成可拼合的图形');
}

function nextLevel() {
  level = Math.min(LEVELS.length, level + 1);
  generateBoard();
}

function cellX(index) { return LEFT + colOf(index) * CELL; }
function cellY(index) { return TOP + rowOf(index) * CELL; }
function triangle(index, orientation, attributes = '') {
  const x = cellX(index), y = cellY(index);
  const points = orientation === 'TL'
    ? `${x},${y} ${x + CELL},${y} ${x},${y + CELL}`
    : `${x + CELL},${y} ${x + CELL},${y + CELL} ${x},${y + CELL}`;
  return `<polygon points="${points}" ${attributes}/>`;
}

function renderBoard() {
  let svg = '<rect x="0" y="0" width="520" height="440" fill="#fff"/>';
  full.forEach(index => {
    svg += `<rect x="${cellX(index)}" y="${cellY(index)}" width="${CELL}" height="${CELL}" fill="${BLUE}"/>`;
  });
  pairs.forEach(pair => { svg += triangle(pair.anchor, 'TL', `fill="${BLUE}"`); });
  for (let i = 0; i <= SIZE; i++) {
    const x = LEFT + i * CELL, y = TOP + i * CELL;
    svg += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + SIZE * CELL}" stroke="#87918f" stroke-width="${i === 0 || i === SIZE ? 1.8 : 1}" opacity=".8"/>`;
    svg += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + SIZE * CELL}" y2="${y}" stroke="#87918f" stroke-width="${i === 0 || i === SIZE ? 1.8 : 1}" opacity=".8"/>`;
  }
  const p = progress / 100;
  pairs.forEach(pair => {
    const x = cellX(pair.mover), y = cellY(pair.mover);
    const dx = (cellX(pair.anchor) - x) * p;
    const dy = (cellY(pair.anchor) - y) * p;
    const angle = pair.rotate ? 180 * p : 0;
    const orientation = pair.rotate ? 'TL' : 'BR';
    if (progress > 0) svg += triangle(pair.mover, orientation, 'fill="none" stroke="#9eb9df" stroke-width="2" stroke-dasharray="5 4"');
    svg += `<g transform="translate(${dx} ${dy}) rotate(${angle} ${x + CELL/2} ${y + CELL/2})">${triangle(pair.mover, orientation, `fill="${BLUE}" stroke="${BLUE_DARK}" stroke-width="2" stroke-linejoin="miter"`)}</g>`;
  });
  if (progress === 100) {
    pairs.forEach(pair => {
      svg += `<rect x="${cellX(pair.anchor)}" y="${cellY(pair.anchor)}" width="${CELL}" height="${CELL}" fill="none" stroke="#1d786f" stroke-width="3"/>`;
    });
  }
  $('shape-canvas').innerHTML = svg;
  const area = full.size + pairs.length;
  const halves = pairs.length * 2;
  const spec = LEVELS[level - 1];
  $('blue-count').textContent = area;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = `${full.size} 个整格 + ${halves} 个半格 = ${area} cm²`;
  $('motion-percent').textContent = `${progress}%`;
  $('motion-note').textContent = progress === 0 ? `${halves} 个半格，试着把它们两两拼合` : progress === 100 ? `拼好了！${halves} 个半格变成 ${pairs.length} 个整格` : '观察蓝色三角形怎样平移和旋转';
  $('level-label').textContent = `第 ${level} 关 / ${LEVELS.length}`;
  $('level-name').textContent = `第 ${level} 关 · ${spec.name}`;
  $('lesson-description').textContent = level === 1
    ? '先从简单的一对半格开始。沿着方格的对角线切开，会得到半格的小三角形。'
    : `这一关有 ${full.size} 个整格、${halves} 个半格。试着找出哪两块半格可以拼成一格。`;
  $('operation-list').innerHTML = pairs.map((pair, index) => `<div><span class="operation-symbol">${pair.rotate ? '↻' : '→'}</span>${pair.rotate ? '旋转半圈再平移' : '平移'}一块半格，补齐第 ${index + 1} 格</div>`).join('');
  $('regenerate-button').textContent = level < LEVELS.length ? '↗ 下一关：难一点' : '↻ 再来一道终极挑战';
  $('new-question').textContent = level < LEVELS.length ? '进入下一关 ↗' : '再来一道终极挑战 ↻';
  $('shape-canvas').setAttribute('aria-label', `第 ${level} 关蓝色图形：${full.size} 个整格和 ${halves} 个半格，面积 ${area} 平方厘米。拼合进度 ${progress}%。`);
}

$('motion-progress').addEventListener('input', event => {
  stopAnimation();
  progress = Number(event.target.value);
  renderBoard();
});
$('play-button').addEventListener('click', () => {
  if (animation !== null) { stopAnimation(); return; }
  if (progress >= 100) progress = 0;
  const initial = progress, start = performance.now();
  $('play-button').textContent = 'Ⅱ 暂停';
  const frame = now => {
    progress = Math.min(100, Math.round(initial + (100 - initial) * (now - start) / 1900));
    $('motion-progress').value = progress;
    renderBoard();
    if (progress < 100) animation = requestAnimationFrame(frame);
    else stopAnimation();
  };
  animation = requestAnimationFrame(frame);
});
$('regenerate-button').addEventListener('click', nextLevel);

function newQuestion() {
  $('question-number').textContent = `第 ${level} 关 / ${LEVELS.length}`;
  $('question-icon').textContent = '◩';
  $('question-icon').style.color = BLUE;
  $('question-text').textContent = `第 ${level} 关：蓝色图形的面积是多少 cm²？`;
  $('answer-input').value = '';
  $('answer-feedback').textContent = `提示：${pairs.length * 2} 个半格可以拼成 ${pairs.length} 个整格。`;
  $('answer-feedback').className = 'feedback';
}

function checkAnswer() {
  const input = $('answer-input').value.trim();
  const feedback = $('answer-feedback');
  if (!input) { feedback.textContent = '先输入你的答案。'; feedback.className = 'feedback incorrect'; return; }
  const area = full.size + pairs.length;
  const correct = Number(input) === area;
  feedback.textContent = correct
    ? `答对了！${full.size} 个整格 + ${pairs.length * 2} 个半格 = ${area} cm²。`
    : `再试一次：先数整格，再把 ${pairs.length * 2} 个半格看成 ${pairs.length} 个整格。`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('new-question').addEventListener('click', nextLevel);
$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
generateBoard();
