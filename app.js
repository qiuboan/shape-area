const $ = id => document.getElementById(id);
const GRID = { left: 60, top: 40, cell: 40, count: 10 };
// Horizontal run divided by vertical height: tan(a) = 1 / 0.6.
const PARALLELOGRAM_RUN_PER_HEIGHT = 0.6;
const PARALLELOGRAM_TAN_ANGLE = 1 / PARALLELOGRAM_RUN_PER_HEIGHT;
const sizes = {
  rectangle: { length: 5, width: 5 },
  parallelogram: { length: 5, width: 5 },
  triangle: { length: 5, width: 5 },
  trapezoid: { length: 4, width: 6, height: 5 }
};
let mode = 'rectangle';
let dimensions = sizes.rectangle;
let puzzle = null;
let trianglePuzzle = null;
let trapezoidPuzzle = null;
let pointerDrag = null;
let feedbackTimer = null;
const CUT_TOLERANCE = 10;
const JOIN_TOLERANCE = 12;

function activePuzzle() {
  return mode === 'parallelogram' ? puzzle : mode === 'triangle' ? trianglePuzzle : mode === 'trapezoid' ? trapezoidPuzzle : null;
}

function clearPuzzleFeedback() {
  if (feedbackTimer !== null) clearTimeout(feedbackTimer);
  feedbackTimer = null;
  const current = activePuzzle();
  if (current) current.feedback = null;
}

function showPuzzleFeedback(kind) {
  clearPuzzleFeedback();
  const currentPuzzle = activePuzzle();
  currentPuzzle.feedback = kind;
  feedbackTimer = setTimeout(() => {
    feedbackTimer = null;
    if (activePuzzle() !== currentPuzzle) return;
    currentPuzzle.feedback = null;
    renderBoard();
  }, 2000);
}

function resetPuzzle() {
  clearPuzzleFeedback();
  const { left, cell } = GRID;
  const base = dimensions.length * cell;
  const correct = left + parallelogramSkew();
  let cutX = left + (base + parallelogramSkew()) / 2;
  if (Math.abs(cutX - correct) <= CUT_TOLERANCE) cutX = Math.max(left + 4, correct - 14);
  puzzle = { phase: 'cut', side: null, cutX, pieceDx: -25, pieceDy: 20, feedback: null };
}

function resetTrianglePuzzle() {
  clearPuzzleFeedback();
  let dx = (GRID.count - dimensions.length) * GRID.cell;
  let dy = (GRID.count - dimensions.width) * GRID.cell;
  if (dx === 0 && dy === 0) { dx = 16; dy = 16; }
  trianglePuzzle = { phase: 'copy', dx, dy, feedback: null };
}

function trapezoidGeometry() {
  const { left, top, cell, count } = GRID;
  const topBase = dimensions.length * cell;
  const bottomBase = dimensions.width * cell;
  const topLeft = left + (count * cell - topBase) / 2;
  const bottomLeft = left + (count * cell - bottomBase) / 2;
  return {
    topLeft,
    topRight: topLeft + topBase,
    bottomLeft,
    bottomRight: bottomLeft + bottomBase,
    top,
    bottom: top + dimensions.height * cell
  };
}

function resetTrapezoidPuzzle() {
  clearPuzzleFeedback();
  const geometry = trapezoidGeometry();
  trapezoidPuzzle = {
    phase: 'cut',
    side: null,
    cutX: (geometry.topLeft + geometry.bottomRight) / 2,
    pieceDx: GRID.left + 10 - geometry.topRight,
    pieceDy: 20,
    feedback: null
  };
}

function parallelogramSkew() {
  const height = dimensions.width * GRID.cell;
  const available = (GRID.count - dimensions.length) * GRID.cell;
  // Leave room between the two valid vertical cuts, even for a 1 cm base.
  return Math.min(height * PARALLELOGRAM_RUN_PER_HEIGHT, available, dimensions.length * GRID.cell - 24);
}

function updateHeightLimit() {
  const baseMax = mode === 'parallelogram' || mode === 'trapezoid' ? 9 : 10;
  dimensions.length = Math.min(dimensions.length, baseMax);
  $('length-range').max = baseMax;
  $('length-max-label').textContent = baseMax;
  const lowerMin = mode === 'trapezoid' ? dimensions.length + 1 : 1;
  $('width-range').min = lowerMin;
  $('width-min-label').textContent = lowerMin;
  const max = mode === 'parallelogram'
    ? Math.min(10, Math.floor(dimensions.length * PARALLELOGRAM_TAN_ANGLE + 1e-9))
    : 10;
  dimensions.width = Math.max(lowerMin, Math.min(dimensions.width, max));
  $('width-range').max = max;
  $('width-max-label').textContent = max;
  $('dimension-range').textContent = mode === 'parallelogram' ? `底 1–9 · 高 1–${max} cm` : mode === 'trapezoid' ? `上底 1–9 · 下底 ${lowerMin}–10 · 高 1–10 cm` : '范围 1–10 cm';
  $('length-range').setAttribute('aria-label', mode === 'parallelogram' ? '底，1 到 9 厘米' : mode === 'trapezoid' ? '上底，1 到 9 厘米' : `${mode === 'triangle' ? '底' : '长'}，1 到 10 厘米`);
  $('width-range').setAttribute('aria-label', mode === 'parallelogram'
    ? `高，1 到 ${max} 厘米，不超过底乘夹角的正切值`
    : mode === 'trapezoid' ? `下底，${lowerMin} 到 10 厘米` : `${mode === 'triangle' ? '高' : '宽'}，1 到 10 厘米`);
  $('height-range').setAttribute('aria-label', '高，1 到 10 厘米');
}

function shapeArea() {
  if (mode === 'trapezoid') return (dimensions.length + dimensions.width) * dimensions.height / 2;
  const product = dimensions.length * dimensions.width;
  return mode === 'triangle' ? product / 2 : product;
}

function equation() {
  const { length, width } = dimensions;
  return mode === 'trapezoid'
    ? `(${length} + ${width}) × ${dimensions.height} ÷ 2 = ${shapeArea()} cm²`
    : mode === 'triangle'
    ? `${length} × ${width} ÷ 2 = ${shapeArea()} cm²`
    : `${length} × ${width} = ${shapeArea()} cm²`;
}

function updateControl(type) {
  if (type === 'height' && mode !== 'trapezoid') return;
  const input = $(`${type}-range`);
  const output = $(`${type}-value`);
  const bar = $(`${type}-bar`);
  const ratio = (dimensions[type] - Number(input.min)) / Math.max(1, Number(input.max) - Number(input.min));
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

function trapezoidBars(geometry) {
  const { topLeft, topRight, bottomLeft, bottomRight, top, bottom } = geometry;
  return `<g aria-hidden="true"><rect x="${topLeft}" y="${top - 5}" width="${topRight - topLeft}" height="10" rx="4" fill="#397bd9"/><rect x="${bottomLeft}" y="${bottom - 5}" width="${bottomRight - bottomLeft}" height="10" rx="4" fill="#397bd9"/><text x="${(topLeft + topRight) / 2}" y="${top - 11}" text-anchor="middle" font-size="14" font-weight="800" fill="#305da5">上底 ${dimensions.length}</text><text x="${(bottomLeft + bottomRight) / 2}" y="${bottom - 14}" text-anchor="middle" font-size="14" font-weight="800" fill="#305da5">下底 ${dimensions.width}</text><text x="${GRID.left - 18}" y="${(top + bottom) / 2}" text-anchor="middle" font-size="14" font-weight="800" fill="#305da5">高 ${dimensions.height}</text></g>`;
}

function renderBoard() {
  const { left, top, cell, count } = GRID;
  const { length, width } = dimensions;
  const area = shapeArea();
  let foreground = '';
  let svg = '<rect x="0" y="0" width="520" height="460" fill="#fff"/>';
  if (mode === 'triangle') {
    const right = left + length * cell;
    const bottom = top + width * cell;
    svg += `<polygon points="${left},${top} ${right},${top} ${left},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
    if (trianglePuzzle.phase !== 'copy') {
      if (trianglePuzzle.phase !== 'complete') {
        svg += `<polygon points="${right},${top} ${right},${bottom} ${left},${bottom}" fill="#edf8ff" stroke="#4a9bca" stroke-width="2" stroke-dasharray="7 5"/>`;
      }
      foreground = `<g data-triangle-copy="true" transform="translate(${trianglePuzzle.dx} ${trianglePuzzle.dy})"><polygon points="${right},${top} ${right},${bottom} ${left},${bottom}" fill="#c9e4ff" stroke="#5596d6" stroke-width="3"/><polygon points="${right},${top} ${right},${bottom} ${left},${bottom}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    }
  } else if (mode === 'trapezoid') {
    const g = trapezoidGeometry();
    if (trapezoidPuzzle.phase === 'cut') {
      svg += `<polygon points="${g.topLeft},${g.top} ${g.topRight},${g.top} ${g.bottomRight},${g.bottom} ${g.bottomLeft},${g.bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      foreground = `<line x1="${trapezoidPuzzle.cutX}" y1="${g.top}" x2="${trapezoidPuzzle.cutX}" y2="${g.bottom}" stroke="#7656bd" stroke-width="3" stroke-dasharray="9 6" pointer-events="none"/><line data-trapezoid-cut="true" x1="${trapezoidPuzzle.cutX}" y1="${g.top}" x2="${trapezoidPuzzle.cutX}" y2="${g.bottom}" stroke="transparent" stroke-width="24" pointer-events="stroke"/>`;
    } else if (trapezoidPuzzle.side === 'left') {
      svg += `<polygon points="${g.topLeft},${g.top} ${g.topRight},${g.top} ${g.bottomRight},${g.bottom} ${g.topLeft},${g.bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      svg += `<polygon points="${g.bottomLeft},${g.bottom} ${g.topLeft},${g.top} ${g.topLeft},${g.bottom}" fill="#dcecff" stroke="#a2c3ed" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      if (trapezoidPuzzle.phase !== 'complete') svg += `<polygon points="${g.topRight},${g.top} ${g.bottomRight},${g.top} ${g.bottomRight},${g.bottom}" fill="#eff9f2" stroke="#47a77d" stroke-width="2" stroke-dasharray="7 5"/>`;
      foreground = `<g data-trapezoid-piece="true" transform="translate(${trapezoidPuzzle.pieceDx} ${trapezoidPuzzle.pieceDy})"><polygon points="${g.topRight},${g.top} ${g.bottomRight},${g.top} ${g.bottomRight},${g.bottom}" fill="#4d8ddd" stroke="#2e69b8" stroke-width="3"/><polygon points="${g.topRight},${g.top} ${g.bottomRight},${g.top} ${g.bottomRight},${g.bottom}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    } else {
      svg += `<polygon points="${g.topLeft},${g.top} ${g.topRight},${g.top} ${g.topRight},${g.bottom} ${g.bottomLeft},${g.bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      svg += `<polygon points="${g.topRight},${g.top} ${g.bottomRight},${g.bottom} ${g.topRight},${g.bottom}" fill="#dcecff" stroke="#a2c3ed" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      if (trapezoidPuzzle.phase !== 'complete') svg += `<polygon points="${g.bottomLeft},${g.top} ${g.topLeft},${g.top} ${g.bottomLeft},${g.bottom}" fill="#eff9f2" stroke="#47a77d" stroke-width="2" stroke-dasharray="7 5"/>`;
      foreground = `<g data-trapezoid-piece="true" transform="translate(${trapezoidPuzzle.pieceDx} ${trapezoidPuzzle.pieceDy})"><polygon points="${g.bottomLeft},${g.top} ${g.topLeft},${g.top} ${g.bottomLeft},${g.bottom}" fill="#4d8ddd" stroke="#2e69b8" stroke-width="3"/><polygon points="${g.bottomLeft},${g.top} ${g.topLeft},${g.top} ${g.bottomLeft},${g.bottom}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    }
  } else if (mode === 'parallelogram') {
    const skew = parallelogramSkew();
    const cutX = left + skew;
    const base = length * cell;
    const bottom = top + width * cell;
    const topRight = cutX + base;
    if (puzzle.phase === 'cut') {
      svg += `<polygon points="${cutX},${top} ${topRight},${top} ${left + base},${bottom} ${left},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      foreground = `<line x1="${puzzle.cutX}" y1="${top}" x2="${puzzle.cutX}" y2="${bottom}" stroke="#7656bd" stroke-width="3" stroke-dasharray="9 6" pointer-events="none"/><line data-cut-handle="true" x1="${puzzle.cutX}" y1="${top}" x2="${puzzle.cutX}" y2="${bottom}" stroke="transparent" stroke-width="24" pointer-events="stroke"/>`;
    } else if (puzzle.side === 'left') {
      svg += `<polygon points="${cutX},${top} ${topRight},${top} ${left + base},${bottom} ${cutX},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      svg += `<polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="#dcecff" stroke="#a2c3ed" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      if (puzzle.phase !== 'complete') svg += `<polygon points="${topRight},${top} ${left + base},${bottom} ${topRight},${bottom}" fill="#eff9f2" stroke="#47a77d" stroke-width="2" stroke-dasharray="7 5"/>`;
      foreground = `<g data-piece="true" transform="translate(${puzzle.pieceDx} ${puzzle.pieceDy})"><polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="#4d8ddd" stroke="#2e69b8" stroke-width="3"/><polygon points="${left},${bottom} ${cutX},${top} ${cutX},${bottom}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    } else {
      svg += `<polygon points="${cutX},${top} ${left + base},${top} ${left + base},${bottom} ${left},${bottom}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
      svg += `<polygon points="${topRight},${top} ${left + base},${bottom} ${left + base},${top}" fill="#dcecff" stroke="#a2c3ed" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      if (puzzle.phase !== 'complete') svg += `<polygon points="${left},${top} ${cutX},${top} ${left},${bottom}" fill="#eff9f2" stroke="#47a77d" stroke-width="2" stroke-dasharray="7 5"/>`;
      foreground = `<g data-piece="true" transform="translate(${puzzle.pieceDx} ${puzzle.pieceDy})"><polygon points="${topRight},${top} ${left + base},${bottom} ${left + base},${top}" fill="#4d8ddd" stroke="#2e69b8" stroke-width="3"/><polygon points="${topRight},${top} ${left + base},${bottom} ${left + base},${top}" fill="transparent" stroke="transparent" stroke-width="14"/></g>`;
    }
  } else {
    svg += `<rect x="${left}" y="${top}" width="${length * cell}" height="${width * cell}" fill="#90b7ed"/>`;
  }
  for (let i = 0; i <= count; i++) {
    const coordinate = i * cell;
    svg += `<line x1="${left + coordinate}" y1="${top}" x2="${left + coordinate}" y2="${top + count * cell}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
    svg += `<line x1="${left}" y1="${top + coordinate}" x2="${left + count * cell}" y2="${top + coordinate}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
  }
  svg += foreground + (mode === 'trapezoid' ? trapezoidBars(trapezoidGeometry()) : boardBar('length') + boardBar('width'));
  $('shape-canvas').innerHTML = svg;
  const shape = mode === 'triangle' ? '直角三角形' : mode === 'parallelogram' ? '平行四边形' : mode === 'trapezoid' ? '等腰梯形' : '长方形';
  const first = mode === 'rectangle' ? '长' : '底';
  const second = mode === 'rectangle' ? '宽' : '高';
  $('shape-canvas').setAttribute('aria-label', mode === 'trapezoid'
    ? `10 乘 10 方格纸中，上底 ${length} 厘米、下底 ${width} 厘米、高 ${dimensions.height} 厘米的蓝色等腰梯形，面积 ${area} 平方厘米。`
    : `10 乘 10 方格纸中，${first} ${length} 厘米、${second} ${width} 厘米的蓝色${shape}，面积 ${area} 平方厘米。`);
  $('motion-note').textContent = mode === 'trapezoid'
    ? `当前上底 ${length} cm、下底 ${width} cm、高 ${dimensions.height} cm。`
    : `当前${first} ${length} cm、${second} ${width} cm。拖动紫色圆点改变图形。`;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = equation();
  $('question-text').textContent = mode === 'trapezoid'
    ? `上底 ${length} cm、下底 ${width} cm、高 ${dimensions.height} cm，面积是多少？`
    : `${first} ${length} cm、${second} ${width} cm，面积是多少？`;
  renderPuzzleUI();
}

function renderPuzzleUI() {
  const button = $('puzzle-action');
  const feedback = $('puzzle-feedback');
  const interactive = mode !== 'rectangle';
  button.hidden = !interactive;
  $('shape-canvas').classList.toggle('interactive', interactive);
  if (!interactive) {
    feedback.hidden = true;
    return;
  }
  const current = activePuzzle();
  const cutting = (mode === 'parallelogram' || mode === 'trapezoid') && current.phase === 'cut';
  const copying = mode === 'triangle' && current.phase === 'copy';
  $('puzzle-action-icon').textContent = cutting ? '✂' : copying ? '⧉' : '🧩';
  $('puzzle-action-text').textContent = cutting ? '剪' : copying ? '复制三角形' : '拼';
  button.disabled = current.phase === 'complete';
  feedback.hidden = !current.feedback;
  feedback.textContent = current.feedback === 'correct' ? '✓' : current.feedback ? '✕' : '';
  feedback.className = `puzzle-feedback ${current.feedback === 'correct' ? 'correct' : 'incorrect'}`;
  if (mode === 'triangle') {
    $('motion-note').textContent = current.feedback === 'join-wrong'
      ? '拼错了：把淡蓝色三角形拖到虚线缺口，再按“拼”。'
      : current.phase === 'complete'
        ? '拼对了！两个一样的三角形组成一个长方形。'
        : copying
          ? '按“复制三角形”，在右下角生成一块淡蓝色三角形。'
          : '拖动淡蓝色三角形到虚线缺口，然后按“拼”。';
    return;
  }
  if (mode === 'trapezoid') {
    const destination = current.side === 'right' ? '左侧' : '右侧';
    $('motion-note').textContent = current.feedback === 'cut-wrong'
      ? '剪错了：把虚线拖到上底左端点或右端点，再按“剪”。'
      : current.feedback === 'join-wrong'
        ? `拼错了：把三角形拖到${destination}虚线缺口，再按“拼”。`
        : current.phase === 'complete'
          ? '拼对了！等腰梯形拼成同高的长方形，面积是（上底＋下底）×高÷2。'
          : cutting
            ? '拖动紫色虚线到上底左端点或右端点，然后按“剪”。'
            : `剪下的三角形已翻转，拖到${destination}缺口，然后按“拼”。`;
    return;
  }
  const destination = current.side === 'right' ? '左侧' : '右侧';
  $('motion-note').textContent = current.feedback === 'cut-wrong'
    ? '剪错了：拖动虚线到左上角顶点的正下方，或右下角顶点的正上方，再按“剪”。'
    : current.feedback === 'join-wrong'
      ? `拼错了：把剪下的蓝色三角形拖到${destination}虚线缺口，再按“拼”。`
      : current.phase === 'complete'
        ? '拼对了！竖切并平移后，图形变成了同底同高的长方形。'
        : cutting
          ? '拖动紫色虚线到左侧或右侧的正确位置，然后按“剪”。'
          : `拖动剪下的蓝色三角形到${destination}缺口，然后按“拼”。`;
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
    const min = GRID.left;
    const max = GRID.left + dimensions.length * GRID.cell;
    puzzle.cutX = Math.max(min, Math.min(max, point.x));
  } else if (pointerDrag.kind === 'trapezoid-cut') {
    const geometry = trapezoidGeometry();
    trapezoidPuzzle.cutX = Math.max(geometry.bottomLeft + 4, Math.min(geometry.bottomRight - 4, point.x));
  } else if (pointerDrag.kind === 'piece') {
    const base = dimensions.length * GRID.cell;
    puzzle.pieceDx = Math.max(-base - 20, Math.min(base + 20, pointerDrag.dx + point.x - pointerDrag.x));
    puzzle.pieceDy = Math.max(-30, Math.min(40, pointerDrag.dy + point.y - pointerDrag.y));
  } else if (pointerDrag.kind === 'trapezoid-piece') {
    trapezoidPuzzle.pieceDx = Math.max(-GRID.count * GRID.cell, Math.min(GRID.count * GRID.cell, pointerDrag.dx + point.x - pointerDrag.x));
    trapezoidPuzzle.pieceDy = Math.max(-30, Math.min(40, pointerDrag.dy + point.y - pointerDrag.y));
  } else {
    const maxDx = (GRID.count - dimensions.length) * GRID.cell + 16;
    const maxDy = (GRID.count - dimensions.width) * GRID.cell + 16;
    trianglePuzzle.dx = Math.max(-20, Math.min(maxDx, pointerDrag.dx + point.x - pointerDrag.x));
    trianglePuzzle.dy = Math.max(-20, Math.min(maxDy, pointerDrag.dy + point.y - pointerDrag.y));
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
  const current = activePuzzle();
  if (!current || current.phase === 'complete') return;
  const cut = mode === 'parallelogram' && current.phase === 'cut' && event.target.closest('[data-cut-handle]');
  const piece = mode === 'parallelogram' && current.phase === 'assemble' && event.target.closest('[data-piece]');
  const triangleCopy = mode === 'triangle' && current.phase === 'assemble' && event.target.closest('[data-triangle-copy]');
  const trapezoidCut = mode === 'trapezoid' && current.phase === 'cut' && event.target.closest('[data-trapezoid-cut]');
  const trapezoidPiece = mode === 'trapezoid' && current.phase === 'assemble' && event.target.closest('[data-trapezoid-piece]');
  if (!cut && !piece && !triangleCopy && !trapezoidCut && !trapezoidPiece) return;
  const point = svgPointer(event);
  if (!point) return;
  event.preventDefault();
  pointerDrag = {
    kind: cut ? 'cut' : piece ? 'piece' : triangleCopy ? 'triangle-copy' : trapezoidCut ? 'trapezoid-cut' : 'trapezoid-piece',
    pointerId: event.pointerId,
    x: point.x,
    y: point.y,
    dx: mode === 'triangle' ? trianglePuzzle.dx : mode === 'trapezoid' ? trapezoidPuzzle.pieceDx : puzzle.pieceDx,
    dy: mode === 'triangle' ? trianglePuzzle.dy : mode === 'trapezoid' ? trapezoidPuzzle.pieceDy : puzzle.pieceDy
  };
  clearPuzzleFeedback();
  document.addEventListener('pointermove', movePointerDrag);
  document.addEventListener('pointerup', finishPointerDrag);
  document.addEventListener('pointercancel', finishPointerDrag);
  renderBoard();
});

$('puzzle-action').addEventListener('click', () => {
  const current = activePuzzle();
  if (!current || current.phase === 'complete') return;
  if (mode === 'triangle') {
    if (current.phase === 'copy') {
      current.phase = 'assemble';
      clearPuzzleFeedback();
    } else if (Math.abs(current.dx) <= JOIN_TOLERANCE && Math.abs(current.dy) <= JOIN_TOLERANCE) {
      current.phase = 'complete';
      current.dx = 0;
      current.dy = 0;
      showPuzzleFeedback('correct');
    } else {
      showPuzzleFeedback('join-wrong');
    }
  } else if (mode === 'trapezoid') {
    if (current.phase === 'cut') {
      const geometry = trapezoidGeometry();
      const leftCut = Math.abs(current.cutX - geometry.topLeft) <= CUT_TOLERANCE;
      const rightCut = Math.abs(current.cutX - geometry.topRight) <= CUT_TOLERANCE;
      if (leftCut || rightCut) {
        current.side = leftCut ? 'left' : 'right';
        current.phase = 'assemble';
        current.pieceDx = current.side === 'left'
          ? GRID.left + 10 - geometry.topRight
          : GRID.left + GRID.count * GRID.cell - geometry.bottomLeft;
        current.pieceDy = 20;
        clearPuzzleFeedback();
      } else {
        showPuzzleFeedback('cut-wrong');
      }
    } else if (Math.abs(current.pieceDx) <= JOIN_TOLERANCE && Math.abs(current.pieceDy) <= JOIN_TOLERANCE) {
      current.phase = 'complete';
      current.pieceDx = 0;
      current.pieceDy = 0;
      showPuzzleFeedback('correct');
    } else {
      showPuzzleFeedback('join-wrong');
    }
  } else if (puzzle.phase === 'cut') {
    const leftCut = Math.abs(puzzle.cutX - (GRID.left + parallelogramSkew())) <= CUT_TOLERANCE;
    const rightCut = Math.abs(puzzle.cutX - (GRID.left + dimensions.length * GRID.cell)) <= CUT_TOLERANCE;
    if (leftCut || rightCut) {
      puzzle.side = leftCut ? 'left' : 'right';
      puzzle.phase = 'assemble';
      puzzle.pieceDx = puzzle.side === 'left' ? -25 : 25;
      puzzle.pieceDy = 20;
      clearPuzzleFeedback();
    } else {
      showPuzzleFeedback('cut-wrong');
    }
  } else {
    const targetDx = (puzzle.side === 'left' ? 1 : -1) * dimensions.length * GRID.cell;
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
  const trapezoid = mode === 'trapezoid';
  const usesBaseHeight = triangle || parallelogram;
  const shapeName = triangle ? '三角形' : parallelogram ? '平行四边形' : trapezoid ? '等腰梯形' : '长方形';
  for (const shape of ['rectangle', 'parallelogram', 'triangle', 'trapezoid']) {
    const button = $(`${shape}-tab`);
    const active = mode === shape;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  $('explore-description').textContent = parallelogram
    ? '调整底和高后，沿左侧或右侧虚线竖切，再把三角形拼到另一侧，亲手验证平行四边形面积。'
    : triangle
      ? '调整底和高后，复制一个同样的三角形，拖到缺口拼成长方形。'
      : trapezoid
        ? '调整上底、下底和高后，从左侧或右侧竖切，再把三角形拼到另一侧，观察等腰梯形如何变成长方形。'
      : '长和宽从 5 cm 开始。拖动紫色圆点改变边长，观察蓝色长方形的面积。';
  $('formula-caption').textContent = `${shapeName}面积`;
  document.querySelector('.formula-sidebar').setAttribute('aria-label', `${shapeName}面积与提示`);
  $('shape-insight').textContent = triangle
    ? '复制一个完全相同的三角形，两个三角形恰好拼成长方形，所以三角形面积是底 × 高 ÷ 2。'
    : parallelogram
      ? '沿左侧或右侧竖切，把剪下的三角形移到另一侧，可拼成同底同高的长方形，所以面积是底 × 高。'
      : trapezoid
        ? '沿等腰梯形左侧或右侧竖切，把剪下的三角形翻转后拼到另一侧，可拼成同高的长方形。长方形的宽是（上底＋下底）÷2。'
      : '长增加 1 cm，面积会增加当前宽的格数；宽增加 1 cm，面积会增加当前长的格数。';
  $('dimension-pill').textContent = trapezoid ? '调整上底、下底与高' : usesBaseHeight ? '调整底与高' : '调整长与宽';
  $('dimension-title').textContent = trapezoid ? '拖动圆点，改变上底、下底和高' : usesBaseHeight ? '拖动圆点，改变底和高' : '拖动圆点，改变长和宽';
  $('dimension-description').textContent = trapezoid
    ? '三根数值条各固定 10 格。调整上底、下底和高后，拖动紫色虚线到上底左端点或右端点，按“剪”；再把三角形拖到另一侧缺口，按“拼”。'
    : usesBaseHeight
    ? parallelogram
      ? '先调整底和高，再拖动图中的虚线到左侧或右侧的正确竖切位置。高不超过底 × tan a；按“剪”检查，接着拖动三角形并按“拼”。'
      : '两根数值条各固定 10 格。调整底和高后，按“复制三角形”，再把淡蓝色三角形拖到缺口处按“拼”。'
    : '每根数值条固定 10 格。蓝格表示当前边长，白格表示剩余长度。拖动紫色圆点，方格纸上的图形会立即变化。';
  $('length-label').textContent = trapezoid ? '上底' : usesBaseHeight ? '底' : '长';
  $('width-label').textContent = trapezoid ? '下底' : usesBaseHeight ? '高' : '宽';
  $('length-direction').textContent = trapezoid ? '上方横边' : usesBaseHeight ? '横向底边' : '横向边长';
  $('width-direction').textContent = trapezoid ? '下方横边' : usesBaseHeight ? '纵向高度' : '纵向边长';
  $('height-control').hidden = !trapezoid;
  $('height-label').textContent = '高';
  $('lab-tip-text').textContent = triangle
    ? '两个完全一样的三角形拼成长方形后，为什么原三角形面积是它的一半？'
    : parallelogram
      ? '沿紫色虚线竖切后，把一侧三角形移到另一侧，为什么面积不变？'
      : trapezoid
        ? '剪下的三角形翻转并移到另一侧后，为什么长方形的宽是两底之和的一半？'
      : '长或宽增加 1 cm，面积会增加多少？';
  $('challenge-description').textContent = trapezoid
    ? '调整上底、下底和高后，先自己计算等腰梯形面积，再来核对答案。'
    : usesBaseHeight
    ? `调整底和高后，先自己计算${shapeName}面积，再来核对答案。`
    : '调整长和宽后，先自己计算面积，再来核对答案。';
  $('question-number').textContent = triangle ? '底 × 高 ÷ 2' : parallelogram ? '底 × 高' : trapezoid ? '（上底＋下底）× 高 ÷ 2' : '长 × 宽';
  $('question-icon').textContent = triangle ? '◢' : parallelogram ? '▱' : trapezoid ? '⏢' : '▭';
}

function selectMode(nextMode) {
  if (mode === nextMode) return;
  clearPuzzleFeedback();
  mode = nextMode;
  dimensions = sizes[mode];
  renderModeCopy();
  updateHeightLimit();
  if (mode === 'parallelogram' && !puzzle) resetPuzzle();
  if (mode === 'triangle' && !trianglePuzzle) resetTrianglePuzzle();
  if (mode === 'trapezoid' && !trapezoidPuzzle) resetTrapezoidPuzzle();
  updateControl('length');
  updateControl('width');
  updateControl('height');
  renderBoard();
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手算算看吧！';
  $('answer-feedback').className = 'feedback';
}

$('rectangle-tab').addEventListener('click', () => selectMode('rectangle'));
$('parallelogram-tab').addEventListener('click', () => selectMode('parallelogram'));
$('triangle-tab').addEventListener('click', () => selectMode('triangle'));
$('trapezoid-tab').addEventListener('click', () => selectMode('trapezoid'));

for (const type of ['length', 'width', 'height']) {
  $(`${type}-range`).addEventListener('input', event => {
    dimensions[type] = Math.max(1, Math.min(Number(event.target.max), Math.round(Number(event.target.value))));
    updateHeightLimit();
    if (mode === 'parallelogram') resetPuzzle();
    if (mode === 'triangle') resetTrianglePuzzle();
    if (mode === 'trapezoid') resetTrapezoidPuzzle();
    updateControl('length');
    updateControl('width');
    updateControl('height');
    renderBoard();
    $('answer-feedback').textContent = '数值变了，再算算新的面积。';
    $('answer-feedback').className = 'feedback';
  });
}

$('reset-board').addEventListener('click', () => {
  dimensions.length = mode === 'trapezoid' ? 4 : 5;
  dimensions.width = mode === 'trapezoid' ? 6 : 5;
  if (mode === 'trapezoid') dimensions.height = 5;
  updateHeightLimit();
  if (mode === 'parallelogram') resetPuzzle();
  if (mode === 'triangle') resetTrianglePuzzle();
  if (mode === 'trapezoid') resetTrapezoidPuzzle();
  updateControl('length');
  updateControl('width');
  updateControl('height');
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
    : `再试一次：用 ${mode === 'triangle' ? '底 × 高 ÷ 2' : mode === 'parallelogram' ? '底 × 高' : mode === 'trapezoid' ? '（上底＋下底）× 高 ÷ 2' : '长 × 宽'} 计算。`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
window.addEventListener('resize', () => { updateControl('length'); updateControl('width'); updateControl('height'); });
updateControl('length');
updateControl('width');
updateControl('height');
renderModeCopy();
updateHeightLimit();
renderBoard();

const pages = ['menu', 'explore', 'ideas', 'challenge'];
function showPage() {
  const requested = window.location.hash.slice(1);
  const currentPage = pages.includes(requested) ? requested : 'menu';
  document.documentElement.dataset.page = currentPage;
  for (const page of pages) $(page).hidden = page !== currentPage;
  for (const link of document.querySelectorAll('.site-header nav a')) {
    if (link.getAttribute('href') === `#${currentPage}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const headerCta = $('header-cta');
  headerCta.href = currentPage === 'menu' ? '#explore' : '#menu';
  $('header-cta-text').textContent = currentPage === 'menu' ? '开始探索' : '返回菜单';
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showPage);
showPage();
