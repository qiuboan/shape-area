const $ = id => document.getElementById(id);
const GRID = { left: 60, top: 40, cell: 40, count: 10 };
const sizes = {
  rectangle: { length: 5, width: 5 },
  parallelogram: { length: 5, width: 5 },
  triangle: { length: 5, width: 5 }
};
let mode = 'rectangle';
let dimensions = sizes.rectangle;

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
  const skew = mode === 'parallelogram' ? Math.min(cell, (GRID.count - dimensions.length) * cell) : 0;
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
  let svg = '<rect x="0" y="0" width="520" height="460" fill="#fff"/>';
  if (mode === 'triangle') {
    svg += `<polygon points="${left},${top} ${left + length * cell},${top} ${left},${top + width * cell}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
  } else if (mode === 'parallelogram') {
    const skew = Math.min(cell, (count - length) * cell);
    svg += `<polygon points="${left + skew},${top} ${left + skew + length * cell},${top} ${left + length * cell},${top + width * cell} ${left},${top + width * cell}" fill="#90b7ed" stroke="#397bd9" stroke-width="2"/>`;
  } else {
    svg += `<rect x="${left}" y="${top}" width="${length * cell}" height="${width * cell}" fill="#90b7ed"/>`;
  }
  for (let i = 0; i <= count; i++) {
    const coordinate = i * cell;
    svg += `<line x1="${left + coordinate}" y1="${top}" x2="${left + coordinate}" y2="${top + count * cell}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
    svg += `<line x1="${left}" y1="${top + coordinate}" x2="${left + count * cell}" y2="${top + coordinate}" stroke="#9aa9a8" stroke-width="${i === 0 || i === count ? 1.8 : 1}"/>`;
  }
  svg += boardBar('length') + boardBar('width');
  $('shape-canvas').innerHTML = svg;
  const shape = mode === 'triangle' ? '直角三角形' : mode === 'parallelogram' ? '平行四边形' : '长方形';
  const first = mode === 'rectangle' ? '长' : '底';
  const second = mode === 'rectangle' ? '宽' : '高';
  $('shape-canvas').setAttribute('aria-label', `10 乘 10 方格纸中，${first} ${length} 厘米、${second} ${width} 厘米的蓝色${shape}，面积 ${area} 平方厘米。`);
  $('motion-note').textContent = `当前${first} ${length} cm、${second} ${width} cm。拖动紫色圆点改变图形。`;
  $('total-count').textContent = `${area} cm²`;
  $('calculation-text').textContent = equation();
  $('question-text').textContent = `${first} ${length} cm、${second} ${width} cm，面积是多少？`;
}

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
  $('explore-description').textContent = usesBaseHeight
    ? `底和高从 5 cm 开始。拖动紫色圆点改变它们，观察蓝色${triangle ? '直角三角形' : '平行四边形'}的面积。`
    : '长和宽从 5 cm 开始。拖动紫色圆点改变边长，观察蓝色长方形的面积。';
  $('formula-caption').textContent = `${shapeName}面积`;
  document.querySelector('.formula-sidebar').setAttribute('aria-label', `${shapeName}面积与提示`);
  $('shape-insight').textContent = triangle
    ? '底增加 1 cm，面积增加当前高的一半；高增加 1 cm，面积增加当前底的一半。'
    : parallelogram
      ? '底增加 1 cm，面积增加当前高的格数；高增加 1 cm，面积增加当前底的格数。'
      : '长增加 1 cm，面积会增加当前宽的格数；宽增加 1 cm，面积会增加当前长的格数。';
  $('dimension-pill').textContent = usesBaseHeight ? '调整底与高' : '调整长与宽';
  $('dimension-title').textContent = usesBaseHeight ? '拖动圆点，改变底和高' : '拖动圆点，改变长和宽';
  $('dimension-description').textContent = usesBaseHeight
    ? `两根数值条各固定 10 格。蓝格分别表示底和高，白格表示剩余长度。拖动紫色圆点，${shapeName}会立即变化。`
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
      ? '把平行四边形一侧的三角形移到另一侧，会得到什么图形？'
      : '长或宽增加 1 cm，面积会增加多少？';
  $('challenge-description').textContent = usesBaseHeight
    ? `调整底和高后，先自己计算${shapeName}面积，再来核对答案。`
    : '调整长和宽后，先自己计算面积，再来核对答案。';
  $('question-number').textContent = triangle ? '底 × 高 ÷ 2' : parallelogram ? '底 × 高' : '长 × 宽';
  $('question-icon').textContent = triangle ? '◢' : parallelogram ? '▱' : '▭';
}

function selectMode(nextMode) {
  if (mode === nextMode) return;
  mode = nextMode;
  dimensions = sizes[mode];
  renderModeCopy();
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
renderBoard();
