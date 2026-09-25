const $ = id => document.getElementById(id);
const GRID = { left: 60, top: 40, cell: 40, count: 10 };
// Horizontal run divided by vertical height: tan(a) = 1 / 0.6.
const PARALLELOGRAM_RUN_PER_HEIGHT = 0.6;
const PARALLELOGRAM_TAN_ANGLE = 1 / PARALLELOGRAM_RUN_PER_HEIGHT;
const sizes = {
  rectangle: { length: 5, width: 5 },
  parallelogram: { length: 5, width: 5 },
  triangle: { length: 5, width: 5 }
};
let mode = 'rectangle';
let dimensions = sizes.rectangle;
let puzzle = null;
let pointerDrag = null;
let feedbackTimer = null;
const CUT_TOLERANCE = 10;
const JOIN_TOLERANCE = 12;

function clearPuzzleFeedback() {
  if (feedbackTimer !== null) clearTimeout(feedbackTimer);
  feedbackTimer = null;
  if (puzzle) puzzle.feedback = null;
}

function showPuzzleFeedback(kind) {
  clearPuzzleFeedback();
  const currentPuzzle = puzzle;
  puzzle.feedback = kind;
  feedbackTimer = setTimeout(() => {
    feedbackTimer = null;
    if (puzzle !== currentPuzzle) return;
    puzzle.feedback = null;
    if (mode === 'parallelogram') renderBoard();
  }, 2000);
}

function resetPuzzle() {
  clearPuzzleFeedback();
  const { left, cell } = GRID;
  const base = dimensions.length * cell;
  const correct = left + parallelogramSkew();
  let cutX = left + (base + parallelogramSkew()) / 2;
  if (Math.abs(cutX - correct) <= CUT_TOLERANCE) cutX = Math.max(left + 4, correct - 14);
  puzzle = { phase: 'cut', cutX, pieceDx: -25, pieceDy: 20, feedback: null };
}

function parallelogramSkew() {
  const height = dimensions.width * GRID.cell;
  const available = (GRID.count - dimensions.length) * GRID.cell;
  return Math.min(height * PARALLELOGRAM_RUN_PER_HEIGHT, available, dimensions.length * GRID.cell);
}

function updateHeightLimit() {
  const baseMax = mode === 'parallelogram' ? 9 : 10;
  dimensions.length = Math.min(dimensions.length, baseMax);
  $('length-range').max = baseMax;
  $('length-max-label').textContent = baseMax;
  const max = mode === 'parallelogram'
    ? Math.min(10, Math.floor(dimensions.length * PARALLELOGRAM_TAN_ANGLE + 1e-9))
    : 10;
  dimensions.width = Math.min(dimensions.width, max);
  $('width-range').max = max;
  $('width-max-label').textContent = max;
  $('dimension-range').textContent = mode === 'parallelogram' ? `底 1–9 · 高 1–${max} cm` : '范围 1–10 cm';
  $('length-range').setAttribute('aria-label', mode === 'parallelogram' ? '底，1 到 9 厘米' : `${mode === 'triangle' ? '底' : '长'}，1 到 10 厘米`);
  $('width-range').setAttribute('aria-label', mode === 'parallelogram'
    ? `高，1 到 ${max} 厘米，不超过底乘夹角的正切值`
    : `${mode === 'triangle' ? '高' : '宽'}，1 到 10 厘米`);
}

function shapeArea() {
  const product = dimensions.length * dimensions.width;
  return mode === 'triangle' ? product / 2 : product;
}

function equation() {
  const { length, width } = dimensions;
  return mode === 'triangle'
    ? `${length} × ${width} ÷ 2 = ${shapeArea()} cm²`
    : `${length} × ${width} = ${shapeArea()} cm²`;
}

function updateControl(type) {
  const input = $(`${type}-range`);
  const output = $(`${type}-value`);
  const bar = $(`${type}-bar`);
  const ratio = (dimensions[type] - 1) / Math.max(1, Number(input.max) - 1);
  input.value = dimensions[type];
  output.value = dimensions[type];
  output.textContent = dimensions[type];
  output.style.left = `${10 + ratio * Math.max(0, input.parentElement.clientWidth - 20)}px`;
  bar.innerHTML = Array.from({ length: 10 }, (_, index) =>
    `<span class="ruler-cell ${index < dimensions[type] ? 'active' : 'empty'}"></span>`
  ).join('');
}

function boardBar(type) {
  const { left, top, cell } = GRID;
  const horizontal = type === 'length';
  const value = dimensions[type];
  const skew = mode === 'parallelogram' ? parallelogramSkew() : 0;
  const x = horizontal ? left + skew : left - 5;
  const y = horizontal ? top - 5 : top;
  const width = horizontal ? value * cell : 10;
  const height = horizontal ? 10 : value * cell;
  const ticks = Array.from({ length: value + 1 }, (_, index) => horizontal
    ? `<line x1="${x + index * cell}" y1="${top - 5}" x2="${x + index * cell}" y2="${top + 5}" stroke="#fff" stroke-opacity=".65"/>`
    : `<line x1="${left - 5}" y1="${top + index * cell}" x2="${left + 5}" y2="${top + index * cell}" stroke="#fff" stroke-opacity=".65"/>`
  ).join('');
  const labelX = horizontal ? x + width / 2 : left - 18;
  const labelY = horizontal ? top - 11 : top + height / 2 + 5;
  return `<g aria-hidden="true"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#397bd9" stroke="#245da9" stroke-width="1.5"/>${ticks}<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="15" font-weight="800" fill="#305da5">${value}</text></g>`;
}

function renderBoard() {
  const { left, top, cell, count } = GRID;
  const { length, width } = dimensions;
  const area = shapeArea();
  let foreground = '';
  let svg = '<rect x="0" y="0" width="520" height="460" fill="#fff"/>';
  if (mode === 'triangle') {
    svg += `<polygon points="${left},${top} ${left + length * cell},${top} ${left},${top + width * cell}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
  } else if (mode === 'parallelogram') {
    const skew = parallelogramSkew();
    const cutX = left + skew;
    const base = length * cell;
    const bottom = top + width * cell;
    const topRight = cutX + base;
    if (puzzle.phase === 'cut') {
      svg += `<polygon points="${cutX},${top} ${topRight},${top} ${left + base},${bottom} ${left},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      foreground = `<line x1="${puzzle.cutX}" y1="${top}" x2="${puzzle.cutX}" y2="${bottom}" stroke="#7656bd" stroke-width="3" stroke-dasharray="9 6" pointer-events="none"/><line data-cut-handle="true" x1="${puzzle.cutX}" y1="${top}" x2="${puzzle.cutX}" y2="${bottom}" stroke="transparent" stroke-width="24" pointer-events="stroke"/>`;
    } else {
      svg += `<polygon points="${cutX},${top} ${topRight},${top} ${left + base},${bottom} ${cutX},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      svg += `<polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="#dcecff" stroke="#a2c3ed" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      if (puzzle.phase !== 'complete') svg += `<polygon points="${topRight},${top} ${left + base},${bottom} ${topRight},${bottom}" fill="#eff9f2" stroke="#47a77d" stroke-width="2" stroke-dasharray="7 5"/>`;
      foreground = `<g data-piece="true" transform="translate(${puzzle.pieceDx} ${puzzle.pieceDy})"><polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="#4d8ddd" stroke="#2e69b8" stroke-width="3"/><polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    }
  } else {
    svg += `<rect x="${left}" y="${top}" width="${length * cell}" height="${width * cell}" fill="#90b7ed"/>`;
  }
  for (let i = 0; i <= count; i++) {
    const coordinate = i * cell;
    svg += `<line x1="${left + coordinate}" y1="${top}" x2="${left + coordinate}" y2="${top + count * cell}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
    svg += `<line x1="${left}" y1="${top + coordinate}" x2="${left + count * cell}" y2="${top + coordinate}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
  }
  svg += foreground + boardBar('length') + boardBar('width');
  $('shape-canvas').innerHTML = svg;
  const shape = mode === 'triangle' ? '直角三角形' : mode === 'parallelogram' ? '平行四边形' : '长方形';
  const first = mode === 'rectangle' ? '长' : '底';
  const second = mode === 'rectangle' ? '宽' : '高';
  $('shape-canvas').setAttribute('aria-label', `10 乘 10 方格纸中，${first} ${length} 厘米、${second} ${width} 厘米的蓝色${shape}，面积 ${area} 平方厘米。`);
  $('motion-note').textContent = `当前${first} ${length} cm、${second} ${width} cm。拖动紫色圆点改变图形。`;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = equation();
  $('question-text').textContent = `${first} ${length} cm、${second} ${width} cm，面积是多少？`;
  renderPuzzleUI();
}

function renderPuzzleUI() {
  const button = $('puzzle-action');
  const feedback = $('puzzle-feedback');
  const interactive = mode === 'parallelogram';
  button.hidden = !interactive;
  $('shape-canvas').classList.toggle('interactive', interactive);
  if (!interactive) {
    feedback.hidden = true;
    return;
  }
  const cutting = puzzle.phase === 'cut';
  $('puzzle-action-icon').textContent = cutting ? '✂' : '🧩';
  $('puzzle-action-text').textContent = cutting ? '剪' : '拼';
  button.disabled = puzzle.phase === 'complete';
  feedback.hidden = !puzzle.feedback;
  feedback.textContent = puzzle.feedback === 'correct' ? '✓' : puzzle.feedback ? '✕' : '';
  feedback.className = `puzzle-feedback ${puzzle.feedback === 'correct' ? 'correct' : 'incorrect'}`;
  $('motion-note').textContent = puzzle.feedback === 'cut-wrong'
    ? '剪错了：拖动虚线到左上角顶点的正下方，再按“剪”。'
    : puzzle.feedback === 'join-wrong'
      ? '拼错了：把剪下的蓝色三角形拖到右侧虚线缺口，再按“拼”。'
      : puzzle.phase === 'complete'
        ? '拼对了！竖切并平移后，图形变成了同底同高的长方形。'
        : cutting
          ? '拖动紫色虚线选择竖切位置，然后按“剪”。'
          : '拖动剪下的蓝色三角形到右侧缺口，然后按“拼”。';
}

function svgPointer(event) {
  const svg = $('shape-canvas');
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

function movePointerDrag(event) {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  const point = svgPointer(event);
  if (!point) return;
  if (pointerDrag.kind === 'cut') {
    const min = GRID.left + 4;
    const max = GRID.left + dimensions.length * GRID.cell - 4;
    puzzle.cutX = Math.max(min, Math.min(max, point.x));
  } else {
    puzzle.pieceDx = Math.max(-40, Math.min(dimensions.length * GRID.cell + 20, pointerDrag.dx + point.x - pointerDrag.x));
    puzzle.pieceDy = Math.max(-30, Math.min(40, pointerDrag.dy + point.y - pointerDrag.y));
  }
  clearPuzzleFeedback();
  renderBoard();
}

function finishPointerDrag(event) {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  if (event.type === 'pointerup') movePointerDrag(event);
  pointerDrag = null;
  document.removeEventListener('pointermove', movePointerDrag);
  document.removeEventListener('pointerup', finishPointerDrag);
  document.removeEventListener('pointercancel', finishPointerDrag);
}

$('shape-canvas').addEventListener('pointerdown', event => {
  if (mode !== 'parallelogram' || puzzle.phase === 'complete') return;
  const cut = event.target.closest('[data-cut-handle]');
  const piece = event.target.closest('[data-piece]');
  if ((puzzle.phase === 'cut' && !cut) || (puzzle.phase === 'assemble' && !piece)) return;
  const point = svgPointer(event);
  if (!point) return;
  event.preventDefault();
  pointerDrag = {
    kind: puzzle.phase === 'cut' ? 'cut' : 'piece',
    pointerId: event.pointerId,
    x: point.x,
    y: point.y,
    dx: puzzle.pieceDx,
    dy: puzzle.pieceDy
  };
  clearPuzzleFeedback();
  document.addEventListener('pointermove', movePointerDrag);
  document.addEventListener('pointerup', finishPointerDrag);
  document.addEventListener('pointercancel', finishPointerDrag);
  renderBoard();
});

$('puzzle-action').addEventListener('click', () => {
  if (mode !== 'parallelogram' || !puzzle || puzzle.phase === 'complete') return;
  if (puzzle.phase === 'cut') {
    const correctX = GRID.left + parallelogramSkew();
    if (Math.abs(puzzle.cutX - correctX) <= CUT_TOLERANCE) {
      puzzle.phase = 'assemble';
      clearPuzzleFeedback();
    } else {
      showPuzzleFeedback('cut-wrong');
    }
  } else {
    const targetDx = dimensions.length * GRID.cell;
    if (Math.abs(puzzle.pieceDx - targetDx) <= JOIN_TOLERANCE && Math.abs(puzzle.pieceDy) <= JOIN_TOLERANCE) {
      puzzle.phase = 'complete';
      puzzle.pieceDx = targetDx;
      puzzle.pieceDy = 0;
      showPuzzleFeedback('correct');
    } else {
      showPuzzleFeedback('join-wrong');
    }
  }
  renderBoard();
});

function renderModeCopy() {
  const triangle = mode === 'triangle';
  const parallelogram = mode === 'parallelogram';
  const usesBaseHeight = triangle || parallelogram;
  const shapeName = triangle ? '三角形' : parallelogram ? '平行四边形' : '长方形';
  for (const shape of ['rectangle', 'parallelogram', 'triangle']) {
    const button = $(`${shape}-tab`);
    const active = mode === shape;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  $('explore-description').textContent = parallelogram
    ? '调整底和高后，沿虚线竖切，再把三角形拼到右侧，亲手验证平行四边形面积。'
    : triangle
      ? '底和高从 5 cm 开始。拖动紫色圆点改变它们，观察蓝色直角三角形的面积。'
      : '长和宽从 5 cm 开始。拖动紫色圆点改变边长，观察蓝色长方形的面积。';
  $('formula-caption').textContent = `${shapeName}面积`;
  document.querySelector('.formula-sidebar').setAttribute('aria-label', `${shapeName}面积与提示`);
  $('shape-insight').textContent = triangle
    ? '底增加 1 cm，面积增加当前高的一半；高增加 1 cm，面积增加当前底的一半。'
    : parallelogram
      ? '沿紫色虚线竖切，把左侧三角形移到右边，可拼成同底同高的长方形，所以面积是底 × 高。'
      : '长增加 1 cm，面积会增加当前宽的格数；宽增加 1 cm，面积会增加当前长的格数。';
  $('dimension-pill').textContent = usesBaseHeight ? '调整底与高' : '调整长与宽';
  $('dimension-title').textContent = usesBaseHeight ? '拖动圆点，改变底和高' : '拖动圆点，改变长和宽';
  $('dimension-description').textContent = usesBaseHeight
    ? parallelogram
      ? '先调整底和高，再拖动图中的虚线选择竖切位置。高不超过底 × tan a；按“剪”检查，接着拖动三角形并按“拼”。'
      : `两根数值条各固定 10 格。蓝格分别表示底和高，白格表示剩余长度。拖动紫色圆点，${shapeName}会立即变化。`
    : '每根数值条固定 10 格。蓝格表示当前边长，白格表示剩余长度。拖动紫色圆点，方格纸上的图形会立即变化。';
  $('length-label').textContent = usesBaseHeight ? '底' : '长';
  $('width-label').textContent = usesBaseHeight ? '高' : '宽';
  $('length-direction').textContent = usesBaseHeight ? '横向底边' : '横向边长';
  $('width-direction').textContent = usesBaseHeight ? '纵向高度' : '纵向边长';
  $('length-range').setAttribute('aria-label', `${usesBaseHeight ? '底' : '长'}，1 到 10 厘米`);
  $('width-range').setAttribute('aria-label', `${usesBaseHeight ? '高' : '宽'}，1 到 10 厘米`);
  $('lab-tip-text').textContent = triangle
    ? '为什么三角形的面积是底乘高的一半？'
    : parallelogram
      ? '沿紫色虚线竖切后，把左侧三角形移到右侧，为什么面积不变？'
      : '长或宽增加 1 cm，面积会增加多少？';
  $('challenge-description').textContent = usesBaseHeight
    ? `调整底和高后，先自己计算${shapeName}面积，再来核对答案。`
    : '调整长和宽后，先自己计算面积，再来核对答案。';
  $('question-number').textContent = triangle ? '底 × 高 ÷ 2' : parallelogram ? '底 × 高' : '长 × 宽';
  $('question-icon').textContent = triangle ? '◢' : parallelogram ? '▱' : '▭';
}

function selectMode(nextMode) {
  if (mode === nextMode) return;
  clearPuzzleFeedback();
  mode = nextMode;
  dimensions = sizes[mode];
  renderModeCopy();
  updateHeightLimit();
  if (mode === 'parallelogram' && !puzzle) resetPuzzle();
  updateControl('length');
  updateControl('width');
  renderBoard();
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手算算看吧！';
  $('answer-feedback').className = 'feedback';
}

$('rectangle-tab').addEventListener('click', () => selectMode('rectangle'));
$('parallelogram-tab').addEventListener('click', () => selectMode('parallelogram'));
$('triangle-tab').addEventListener('click', () => selectMode('triangle'));

for (const type of ['length', 'width']) {
  $(`${type}-range`).addEventListener('input', event => {
    dimensions[type] = Math.max(1, Math.min(Number(event.target.max), Math.round(Number(event.target.value))));
    updateHeightLimit();
    if (mode === 'parallelogram') resetPuzzle();
    updateControl('length');
    updateControl('width');
    renderBoard();
    $('answer-feedback').textContent = '数值变了，再算算新的面积。';
    $('answer-feedback').className = 'feedback';
  });
}

$('reset-board').addEventListener('click', () => {
  dimensions.length = 5;
  dimensions.width = 5;
  updateHeightLimit();
  if (mode === 'parallelogram') resetPuzzle();
  updateControl('length');
  updateControl('width');
  renderBoard();
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手算算看吧！';
  $('answer-feedback').className = 'feedback';
});

function checkAnswer() {
  const feedback = $('answer-feedback');
  const answer = $('answer-input').value.trim();
  if (!answer) {
    feedback.textContent = '先输入你的答案。';
    feedback.className = 'feedback incorrect';
    return;
  }
  const area = shapeArea();
  const correct = Number(answer) === area;
  feedback.textContent = correct
    ? `答对了！${equation()}。`
    : `再试一次：用 ${mode === 'triangle' ? '底 × 高 ÷ 2' : mode === 'parallelogram' ? '底 × 高' : '长 × 宽'} 计算。`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
window.addEventListener('resize', () => { updateControl('length'); updateControl('width'); });
updateControl('length');
updateControl('width');
renderModeCopy();
updateHeightLimit();
renderBoard();
