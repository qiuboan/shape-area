const $ = id => document.getElementById(id);
const GRID = { left: 60, top: 20, cell: 40, count: 10 };
const dimensions = { length: 5, width: 5 };
const placed = { length: false, width: false };
let origin = { x: 2, y: 2 };
let drag = null;

function format(value) {
  return Number(value.toFixed(2)).toString();
}

function svgPoint(clientX, clientY) {
  const matrix = $('shape-canvas').getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return {
    x: (point.x - GRID.left) / GRID.cell,
    y: (point.y - GRID.top) / GRID.cell
  };
}

function insideGrid(point) {
  return point && point.x >= 0 && point.x <= 10 && point.y >= 0 && point.y <= 10;
}

function clampOrigin(x, y, includeLength, includeWidth) {
  const maxX = includeLength ? Math.floor(10 - dimensions.length) : 9;
  const maxY = includeWidth ? Math.floor(10 - dimensions.width) : 9;
  return {
    x: Math.max(0, Math.min(maxX, Math.floor(x))),
    y: Math.max(0, Math.min(maxY, Math.floor(y)))
  };
}

function proposedOrigin(type, point) {
  const addingLength = placed.length || type === 'length';
  const addingWidth = placed.width || type === 'width';
  // The second strip joins the first at its starting corner.
  const joinsFirst = !placed[type] && (placed.length || placed.width);
  const x = joinsFirst ? origin.x : point.x;
  const y = joinsFirst ? origin.y : point.y;
  return clampOrigin(x, y, addingLength, addingWidth);
}

function barMarkup(type, position, preview = false) {
  const x = GRID.left + position.x * GRID.cell;
  const y = GRID.top + position.y * GRID.cell;
  const value = dimensions[type];
  const length = value * GRID.cell;
  const isLength = type === 'length';
  const barX = isLength ? x : x - 5;
  const barY = isLength ? y - 5 : y;
  const barWidth = isLength ? length : 10;
  const barHeight = isLength ? 10 : length;
  const labelX = isLength ? x + length / 2 : x - 17;
  const labelY = isLength ? y - 12 : y + length / 2 + 4;
  const mark = isLength
    ? Array.from({ length: Math.floor(value) + 1 }, (_, i) => `<line x1="${x + i * 40}" x2="${x + i * 40}" y1="${y - 5}" y2="${y + 5}" stroke="#fff" stroke-opacity=".65"/>`).join('')
    : Array.from({ length: Math.floor(value) + 1 }, (_, i) => `<line x1="${x - 5}" x2="${x + 5}" y1="${y + i * 40}" y2="${y + i * 40}" stroke="#fff" stroke-opacity=".65"/>`).join('');
  return `<g ${preview ? 'opacity=".55" pointer-events="none"' : `data-board-bar="${type}" role="button" tabindex="0" aria-label="拖动${isLength ? '长' : '宽'}的蓝条重新放置"`} class="board-bar"><rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="4" fill="#397bd9" stroke="#245da9" stroke-width="1.5"/>${mark}<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="15" font-weight="800" fill="#305da5" pointer-events="none">${format(value)}</text><rect x="${barX - 8}" y="${barY - 8}" width="${barWidth + 16}" height="${barHeight + 16}" fill="transparent"/></g>`;
}

function renderBoard(previewType = null, previewPosition = null) {
  const { left, top, cell, count } = GRID;
  const displayOrigin = previewPosition || origin;
  let svg = '<rect x="0" y="0" width="520" height="440" fill="#fff"/>';
  if (placed.length && placed.width) {
    const x = left + displayOrigin.x * cell;
    const y = top + displayOrigin.y * cell;
    svg += `<rect x="${x}" y="${y}" width="${dimensions.length * cell}" height="${dimensions.width * cell}" fill="#b8d5fb" fill-opacity=".65"/>`;
  }
  for (let i = 0; i <= count; i++) {
    const coordinate = i * cell;
    svg += `<line x1="${left + coordinate}" y1="${top}" x2="${left + coordinate}" y2="${top + count * cell}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
    svg += `<line x1="${left}" y1="${top + coordinate}" x2="${left + count * cell}" y2="${top + coordinate}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
  }
  for (const type of ['length', 'width']) {
    if (placed[type]) svg += barMarkup(type, displayOrigin);
  }
  if (previewType && previewPosition && !placed[previewType]) svg += barMarkup(previewType, previewPosition, true);
  $('shape-canvas').innerHTML = svg;
  const complete = placed.length && placed.width;
  const area = dimensions.length * dimensions.width;
  $('total-count').textContent = complete ? `${format(area)} cm²` : '等待放入长和宽';
  $('calculation-text').textContent = complete
    ? `${format(dimensions.length)} × ${format(dimensions.width)} = ${format(area)} cm²`
    : '长 × 宽 = 面积';
  $('question-text').textContent = complete
    ? `长 ${format(dimensions.length)} cm、宽 ${format(dimensions.width)} cm，面积是多少？`
    : '把长和宽放入方格纸，再计算面积。';
  $('shape-canvas').setAttribute('aria-label', complete
    ? `10 乘 10 方格纸中，长 ${format(dimensions.length)} 厘米、宽 ${format(dimensions.width)} 厘米的长方形，面积 ${format(area)} 平方厘米。`
    : `10 乘 10 方格纸。${placed.length ? '已放入长。' : ''}${placed.width ? '已放入宽。' : ''}`);
}

function setNote() {
  $('motion-note').textContent = placed.length && placed.width
    ? '两根蓝条已放好。拖动紫色圆点，观察面积怎样变化。'
    : placed.length || placed.width
      ? `已放入${placed.length ? '长' : '宽'}，再把另一根蓝条拖进方格纸。`
      : '先拖动紫色圆点调整数值，再把蓝条拖进方格纸。';
}

function updateControl(type) {
  const input = $(`${type}-range`);
  const output = $(`${type}-value`);
  const bar = $(`${type}-bar`);
  const ratio = (dimensions[type] - 1) / 9;
  output.value = format(dimensions[type]);
  output.textContent = format(dimensions[type]);
  const wrap = input.parentElement;
  output.style.left = `${10 + ratio * Math.max(0, wrap.clientWidth - 20)}px`;
  bar.style.width = `${dimensions[type] * 10}%`;
  bar.setAttribute('aria-label', `把${type === 'length' ? '长' : '宽'} ${format(dimensions[type])} 厘米的蓝条拖入方格`);
}

for (const type of ['length', 'width']) {
  $(`${type}-range`).addEventListener('input', event => {
    dimensions[type] = Number(event.target.value);
    if (placed.length || placed.width) {
      origin = clampOrigin(origin.x, origin.y, placed.length, placed.width);
    }
    updateControl(type);
    renderBoard();
    $('answer-feedback').textContent = '数值变了，再算算新的面积。';
    $('answer-feedback').className = 'feedback';
  });
  $(`${type}-bar`).addEventListener('pointerdown', event => beginDrag(event, type));
  $(`${type}-bar`).addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!placed.length && !placed.width) origin = clampOrigin(2, 2, type === 'length', type === 'width');
    placed[type] = true;
    origin = clampOrigin(origin.x, origin.y, placed.length, placed.width);
    renderBoard();
    setNote();
  });
}

function beginDrag(event, type) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  drag = { type, pointerId: event.pointerId, preview: null };
  document.body.classList.add('is-dragging');
  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', cancelDrag);
  moveDrag(event);
}

function moveDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const point = svgPoint(event.clientX, event.clientY);
  drag.preview = insideGrid(point) ? proposedOrigin(drag.type, point) : null;
  renderBoard(drag.preview ? drag.type : null, drag.preview);
  $('shape-canvas').classList.toggle('drop-ready', Boolean(drag.preview));
}

function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const point = svgPoint(event.clientX, event.clientY);
  if (insideGrid(point)) {
    origin = proposedOrigin(drag.type, point);
    placed[drag.type] = true;
    origin = clampOrigin(origin.x, origin.y, placed.length, placed.width);
    $('answer-feedback').textContent = '现在试着算出面积。';
    $('answer-feedback').className = 'feedback';
  }
  finishDrag();
}

function cancelDrag(event) {
  if (drag && event.pointerId === drag.pointerId) finishDrag();
}

function finishDrag() {
  drag = null;
  document.body.classList.remove('is-dragging');
  $('shape-canvas').classList.remove('drop-ready');
  document.removeEventListener('pointermove', moveDrag);
  document.removeEventListener('pointerup', endDrag);
  document.removeEventListener('pointercancel', cancelDrag);
  renderBoard();
  setNote();
}

$('shape-canvas').addEventListener('pointerdown', event => {
  const bar = event.target.closest('[data-board-bar]');
  if (bar) beginDrag(event, bar.dataset.boardBar);
});
$('shape-canvas').addEventListener('keydown', event => {
  const bar = event.target.closest('[data-board-bar]');
  if (!bar || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const deltaX = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
  const deltaY = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
  origin = clampOrigin(origin.x + deltaX, origin.y + deltaY, placed.length, placed.width);
  renderBoard();
});
$('reset-board').addEventListener('click', () => {
  placed.length = false;
  placed.width = false;
  origin = { x: 2, y: 2 };
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手算算看吧！';
  $('answer-feedback').className = 'feedback';
  renderBoard();
  setNote();
});
function checkAnswer() {
  const feedback = $('answer-feedback');
  if (!placed.length || !placed.width) {
    feedback.textContent = '先把长和宽放入方格纸。';
    feedback.className = 'feedback incorrect';
    return;
  }
  const answer = $('answer-input').value.trim();
  if (!answer) {
    feedback.textContent = '先输入你的答案。';
    feedback.className = 'feedback incorrect';
    return;
  }
  const area = dimensions.length * dimensions.width;
  const correct = Math.abs(Number(answer) - area) < 0.000001;
  feedback.textContent = correct
    ? `答对了！${format(dimensions.length)} × ${format(dimensions.width)} = ${format(area)} cm²。`
    : `再试一次：用 ${format(dimensions.length)} × ${format(dimensions.width)} 计算。`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}
$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
window.addEventListener('resize', () => { updateControl('length'); updateControl('width'); });
updateControl('length');
updateControl('width');
renderBoard();
