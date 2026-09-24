const SIZE = 10, CELL = 40, LEFT = 60, TOP = 20;
const BLUE = '#638fda', BLUE_DARK = '#386ac0';
const $ = id => document.getElementById(id);
let full = new Set(), pairs = [], progress = 0, animation = null, questionCount = 0;

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

function choosePairs() {
  const empty = Array.from({ length: 100 }, (_, i) => i).filter(i => !full.has(i));
  const touchesTopOrLeft = i => (rowOf(i) > 0 && full.has(i - SIZE)) || (colOf(i) > 0 && full.has(i - 1));
  const touchesBottomOrRight = i => (rowOf(i) < 9 && full.has(i + SIZE)) || (colOf(i) < 9 && full.has(i + 1));
  const tl = empty.filter(touchesTopOrLeft);
  const br = empty.filter(touchesBottomOrRight);
  if (tl.length < 3 || br.length < 1) return false;
  const used = new Set();
  const pick = candidates => {
    const options = candidates.filter(i => !used.has(i));
    if (!options.length) return null;
    const selected = randomItem(options);
    used.add(selected);
    return selected;
  };
  const anchor1 = pick(tl), mover1 = pick(br), anchor2 = pick(tl), mover2 = pick(tl);
  if ([anchor1, mover1, anchor2, mover2].some(i => i === null)) return false;
  pairs = [
    { anchor: anchor1, mover: mover1, rotate: false },
    { anchor: anchor2, mover: mover2, rotate: true }
  ];
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
  for (let attempt = 0; attempt < 100; attempt++) {
    if (growFull(18 + Math.floor(Math.random() * 9)) && choosePairs()) {
      renderBoard();
      newQuestion();
      return;
    }
  }
  throw new Error('无法生成可拼合的图形');
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
  $('blue-count').textContent = area;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = `${full.size} 个整格 + 4 个半格 = ${area} cm²`;
  $('motion-percent').textContent = `${progress}%`;
  $('motion-note').textContent = progress === 0 ? '4 个半格中，两块将通过运动去补齐另外两块' : progress === 100 ? '拼好了！4 个半格变成 2 个整格' : '一块在平移，另一块旋转并平移';
  $('shape-canvas').setAttribute('aria-label', `蓝色不规则图形：${full.size} 个整格和 4 个半格，面积 ${area} 平方厘米。拼合进度 ${progress}%。`);
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
$('regenerate-button').addEventListener('click', generateBoard);

function newQuestion() {
  questionCount++;
  $('question-number').textContent = `${String(questionCount).padStart(2, '0')} / ∞`;
  $('question-icon').textContent = '◩';
  $('question-icon').style.color = BLUE;
  $('question-text').textContent = '蓝色图形的面积是多少 cm²？';
  $('answer-input').value = '';
  $('answer-feedback').textContent = '提示：两个半格拼成一整格。';
  $('answer-feedback').className = 'feedback';
}

function checkAnswer() {
  const input = $('answer-input').value.trim();
  const feedback = $('answer-feedback');
  if (!input) { feedback.textContent = '先输入你的答案。'; feedback.className = 'feedback incorrect'; return; }
  const area = full.size + pairs.length;
  const correct = Number(input) === area;
  feedback.textContent = correct
    ? `答对了！${full.size} 个整格 + 4 个半格 = ${area} cm²。`
    : '再试一次：先数整格，再把 4 个半格看成 2 个整格。';
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('new-question').addEventListener('click', generateBoard);
$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
generateBoard();
