const $ = id => document.getElementById(id);
const GRID = { left: 60, top: 40, cell: 40, count: 10 };
const dimensions = { length: 5, width: 5 };

function updateControl(type) {
  const input = $(`${type}-range`);
  const output = $(`${type}-value`);
  const bar = $(`${type}-bar`);
  const ratio = (dimensions[type] - 1) / 9;
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
  const x = horizontal ? left : left - 5;
  const y = horizontal ? top - 5 : top;
  const width = horizontal ? value * cell : 10;
  const height = horizontal ? 10 : value * cell;
  const ticks = Array.from({ length: value + 1 }, (_, index) => horizontal
    ? `<line x1="${left + index * cell}" y1="${top - 5}" x2="${left + index * cell}" y2="${top + 5}" stroke="#fff" stroke-opacity=".65"/>`
    : `<line x1="${left - 5}" y1="${top + index * cell}" x2="${left + 5}" y2="${top + index * cell}" stroke="#fff" stroke-opacity=".65"/>`
  ).join('');
  const labelX = horizontal ? left + width / 2 : left - 18;
  const labelY = horizontal ? top - 11 : top + height / 2 + 5;
  return `<g aria-hidden="true"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#397bd9" stroke="#245da9" stroke-width="1.5"/>${ticks}<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="15" font-weight="800" fill="#305da5">${value}</text></g>`;
}

function renderBoard() {
  const { left, top, cell, count } = GRID;
  const { length, width } = dimensions;
  const area = length * width;
  let svg = '<rect x="0" y="0" width="520" height="460" fill="#fff"/>';
  svg += `<rect x="${left}" y="${top}" width="${length * cell}" height="${width * cell}" fill="#90b7ed"/>`;
  for (let i = 0; i <= count; i++) {
    const coordinate = i * cell;
    svg += `<line x1="${left + coordinate}" y1="${top}" x2="${left + coordinate}" y2="${top + count * cell}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
    svg += `<line x1="${left}" y1="${top + coordinate}" x2="${left + count * cell}" y2="${top + coordinate}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
  }
  svg += boardBar('length') + boardBar('width');
  $('shape-canvas').innerHTML = svg;
  $('shape-canvas').setAttribute('aria-label', `10 乘 10 方格纸中，长 ${length} 厘米、宽 ${width} 厘米的蓝色长方形，面积 ${area} 平方厘米。`);
  $('motion-note').textContent = `当前长 ${length} cm、宽 ${width} cm。拖动紫色圆点改变图形。`;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = `${length} × ${width} = ${area} cm²`;
  $('question-text').textContent = `长 ${length} cm、宽 ${width} cm，面积是多少？`;
}

for (const type of ['length', 'width']) {
  $(`${type}-range`).addEventListener('input', event => {
    dimensions[type] = Math.max(1, Math.min(10, Math.round(Number(event.target.value))));
    updateControl(type);
    renderBoard();
    $('answer-feedback').textContent = '数值变了，再算算新的面积。';
    $('answer-feedback').className = 'feedback';
  });
}

$('reset-board').addEventListener('click', () => {
  dimensions.length = 5;
  dimensions.width = 5;
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
  const area = dimensions.length * dimensions.width;
  const correct = Number(answer) === area;
  feedback.textContent = correct
    ? `答对了！${dimensions.length} × ${dimensions.width} = ${area} cm²。`
    : `再试一次：用 ${dimensions.length} × ${dimensions.width} 计算。`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });
window.addEventListener('resize', () => { updateControl('length'); updateControl('width'); });
updateControl('length');
updateControl('width');
renderBoard();
