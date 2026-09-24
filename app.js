const lessons = {
  rectangle: { title: '长方形的面积', tag: '基础面积', operation: '数一数方格', description: '每行有几格？一共有几行？用乘法就能快速算出所有小方格。', insight: '把每行的小方格数乘以行数，就是总面积。', formula: '长 × 宽', controls: [{ key: 'width', label: '长', min: 3, max: 9 }, { key: 'height', label: '宽', min: 2, max: 6 }] },
  parallelogram: { title: '平行四边形的面积', tag: '平移 · 割补', operation: '剪下三角形，向右平移', description: '沿着高剪下左边的三角形，把它平移到右边，恰好拼成一个长方形。', insight: '拼接前后没有增加或减少面积，所以面积等于底乘高。', formula: '底 × 高', controls: [{ key: 'base', label: '底', min: 4, max: 9 }, { key: 'height', label: '高', min: 2, max: 6 }] },
  triangle: { title: '三角形的面积', tag: '旋转 · 拼接', operation: '旋转一份相同的三角形', description: '复制一个完全相同的三角形，旋转半圈，两个三角形拼成平行四边形。', insight: '一个三角形只占拼成的平行四边形的一半。', formula: '底 × 高 ÷ 2', controls: [{ key: 'base', label: '底', min: 4, max: 9 }, { key: 'height', label: '高', min: 2, max: 6 }] },
  trapezoid: { title: '梯形的面积', tag: '旋转 · 拼接', operation: '旋转一份相同的梯形', description: '复制一个完全相同的梯形，旋转半圈，两个梯形拼成平行四边形。', insight: '拼成的平行四边形底是“上底＋下底”，一个梯形占它的一半。', formula: '(上底 + 下底) × 高 ÷ 2', controls: [{ key: 'top', label: '上底', min: 3, max: 8 }, { key: 'bottom', label: '下底', min: 5, max: 9 }, { key: 'height', label: '高', min: 2, max: 6 }] }
};

const values = { rectangle: { width: 6, height: 4 }, parallelogram: { base: 6, height: 4 }, triangle: { base: 6, height: 4 }, trapezoid: { top: 4, bottom: 7, height: 4 } };
let shape = 'rectangle';
let progress = 0;
let animation = null;
const $ = id => document.getElementById(id);
const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
const polygon = (points, fill, stroke = '#185e61', extra = '') => `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" ${extra}/>`;
const label = (x, y, text, anchor = 'middle', color = '#3d6666') => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="16" font-weight="700" font-family="DM Sans, Noto Sans SC, sans-serif">${text}</text>`;
const dash = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ee9a52" stroke-width="2" stroke-dasharray="6 5"/>`;

function stopAnimation() {
  if (animation) cancelAnimationFrame(animation);
  animation = null;
  $('play-button').textContent = '▶ 播放';
}

function setShape(next) {
  stopAnimation();
  shape = next;
  progress = 0;
  $('motion-progress').value = 0;
  const lesson = lessons[shape];
  document.querySelectorAll('.shape-tab').forEach(tab => {
    const selected = tab.dataset.shape === shape;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  $('lab-panel').setAttribute('aria-labelledby', `tab-${shape}`);
  $('shape-title').textContent = lesson.title;
  $('shape-tag').textContent = lesson.tag;
  $('canvas-operation').textContent = lesson.operation;
  $('shape-description').textContent = lesson.description;
  $('shape-insight').textContent = lesson.insight;
  $('formula-text').textContent = lesson.formula;
  $('lesson-number').textContent = `${String(Object.keys(lessons).indexOf(shape) + 1).padStart(2, '0')} / 04`;
  $('shape-controls').innerHTML = lesson.controls.map(c => `<div class="control"><label for="control-${c.key}">${c.label}</label><input id="control-${c.key}" data-key="${c.key}" type="range" min="${c.min}" max="${c.max}" value="${values[shape][c.key]}"><output id="output-${c.key}" for="control-${c.key}">${values[shape][c.key]} cm</output></div>`).join('');
  document.querySelectorAll('#shape-controls input').forEach(input => input.addEventListener('input', () => {
    values[shape][input.dataset.key] = Number(input.value);
    if (shape === 'trapezoid' && values.trapezoid.top >= values.trapezoid.bottom) {
      if (input.dataset.key === 'top') values.trapezoid.bottom = Math.min(9, values.trapezoid.top + 1);
      else values.trapezoid.top = Math.max(3, values.trapezoid.bottom - 1);
      $('control-top').value = values.trapezoid.top;
      $('control-bottom').value = values.trapezoid.bottom;
    }
    document.querySelectorAll('#shape-controls input').forEach(el => { $(`output-${el.dataset.key}`).textContent = `${values[shape][el.dataset.key]} cm`; });
    render();
  }));
  render();
}

function render() {
  const v = values[shape], p = progress / 100;
  let svg = '';
  let step = '';
  let calculation = '';
  if (shape === 'rectangle') {
    const cell = 39, w = v.width * cell, h = v.height * cell, x = (640 - w) / 2, y = (326 - h) / 2;
    const count = Math.round(p * v.width * v.height);
    for (let row = 0; row < v.height; row++) for (let col = 0; col < v.width; col++) {
      const filled = row * v.width + col < count;
      svg += `<rect x="${x + col * cell}" y="${y + row * cell}" width="${cell}" height="${cell}" fill="${filled ? '#84c3b2' : '#dcece3'}" stroke="#fff" stroke-width="2"/>`;
    }
    svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#26786f" stroke-width="3"/>`;
    svg += label(x + w / 2, y + h + 30, `${v.width} cm`) + label(x - 19, y + h / 2, `${v.height} cm`, 'end');
    step = count === 0 ? '拖动进度条，数一数一共有多少格' : count === v.width * v.height ? `数完啦！一共有 ${count} 个 1 cm² 的小方格` : `已经数出 ${count} 个小方格`;
    calculation = `${v.width} × ${v.height} = ${v.width * v.height} cm²`;
  } else if (shape === 'parallelogram') {
    const w = v.base * 38, h = v.height * 38, s = 62, x = (640 - w - s) / 2, y = (326 - h) / 2;
    const original = `${x+s},${y} ${x+s+w},${y} ${x+w},${y+h} ${x},${y+h}`;
    svg += polygon(original, 'none', '#abc5bc', 'stroke-dasharray="7 6"');
    svg += polygon(`${x+s},${y} ${x+s+w},${y} ${x+w},${y+h} ${x+s},${y+h}`, '#65b3a5');
    svg += `<g transform="translate(${w*p} 0)">${polygon(`${x+s},${y} ${x},${y+h} ${x+s},${y+h}`, '#f3ac69', '#d8833d')}</g>`;
    svg += dash(x+s, y, x+s, y+h) + label(x+w/2, y+h+30, `${v.base} cm`) + label(x+s-14, y+h/2, `${v.height} cm`, 'end', '#ca7b3b');
    if (p > .82) svg += label(x+s+w/2, y-15, '拼成了长方形 ✓', 'middle', '#238376');
    step = p === 0 ? '左边的三角形已经剪好，准备平移' : p === 1 ? '拼成了长方形！底和高没有改变' : '把剪下的三角形慢慢移到右边';
    calculation = `${v.base} × ${v.height} = ${v.base * v.height} cm²`;
  } else if (shape === 'triangle') {
    const w = v.base * 38, h = v.height * 38, s = 54, x = (640 - w - s) / 2, y = (326 - h) / 2;
    const pts = `${x+s},${y} ${x+w},${y+h} ${x},${y+h}`;
    const cx = x + (w+s)/2, cy = y+h/2;
    svg += `<g opacity="${.22 + .7*p}" transform="rotate(${180*p} ${cx} ${cy})">${polygon(pts, '#f3ae6d', '#d98a48')}</g>`;
    svg += polygon(pts, '#64b2a6');
    svg += dash(x+s, y, x+s, y+h) + label(x+w/2, y+h+30, `${v.base} cm`) + label(x+s-13, y+h/2, `${v.height} cm`, 'end', '#c97936');
    if (p > .82) svg += label(cx, y-14, '两个相同的三角形', 'middle', '#238376');
    step = p === 0 ? '浅色图形是一份相同的三角形' : p === 1 ? '两个三角形拼成平行四边形，原图形占一半' : '旋转第二个三角形，看看会拼成什么';
    calculation = `${v.base} × ${v.height} ÷ 2 = ${fmt(v.base * v.height / 2)} cm²`;
  } else {
    const bottom = v.bottom * 36, top = v.top * 36, h = v.height * 38;
    const t = (bottom - top)/2, x = (640 - bottom - top)/2, y = (326 - h)/2;
    const pts = `${x+t},${y} ${x+t+top},${y} ${x+bottom},${y+h} ${x},${y+h}`;
    const cx = x + (t+top+bottom)/2, cy = y+h/2;
    svg += `<g opacity="${.24 + .7*p}" transform="rotate(${180*p} ${cx} ${cy})">${polygon(pts, '#f3ae6d', '#d98a48')}</g>`;
    svg += polygon(pts, '#64b2a6');
    svg += dash(x+t, y, x+t, y+h) + label(x+t+top/2, y-14, `${v.top} cm`) + label(x+bottom/2, y+h+30, `${v.bottom} cm`) + label(x+t-12, y+h/2, `${v.height} cm`, 'end', '#c97936');
    if (p > .82) svg += label(cx, y+h+52, `拼成的底 = ${v.top} + ${v.bottom} cm`, 'middle', '#238376');
    step = p === 0 ? '浅色图形是一份相同的梯形' : p === 1 ? '拼成平行四边形，原梯形占一半' : '旋转第二个梯形，注意拼成的新底边';
    calculation = `(${v.top} + ${v.bottom}) × ${v.height} ÷ 2 = ${fmt((v.top + v.bottom) * v.height / 2)} cm²`;
  }
  $('shape-canvas').innerHTML = svg;
  $('shape-canvas').setAttribute('aria-label', `${lessons[shape].title}演示。${step}。${calculation}`);
  $('step-label').textContent = step;
  $('progress-percent').textContent = `${progress}%`;
  $('calculation-text').textContent = calculation;
}

document.querySelectorAll('.shape-tab').forEach(tab => {
  tab.addEventListener('click', () => setShape(tab.dataset.shape));
  tab.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...document.querySelectorAll('.shape-tab')];
    const index = tabs.indexOf(tab);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    setShape(tabs[next].dataset.shape);
  });
});

$('motion-progress').addEventListener('input', e => { stopAnimation(); progress = Number(e.target.value); render(); });
$('play-button').addEventListener('click', () => {
  if (animation) { stopAnimation(); return; }
  if (progress >= 100) progress = 0;
  const startProgress = progress, startTime = performance.now();
  $('play-button').textContent = 'Ⅱ 暂停';
  const tick = now => {
    progress = Math.min(100, Math.round(startProgress + (100-startProgress) * (now-startTime)/1800));
    $('motion-progress').value = progress;
    render();
    if (progress < 100) animation = requestAnimationFrame(tick);
    else stopAnimation();
  };
  animation = requestAnimationFrame(tick);
});

let question = null, questionCount = 0;
function newQuestion() {
  const types = ['rectangle', 'parallelogram', 'triangle', 'trapezoid'];
  const type = types[Math.floor(Math.random() * types.length)];
  const base = 4 + Math.floor(Math.random()*6), height = 2 + Math.floor(Math.random()*5);
  const top = 3 + Math.floor(Math.random()*4), bottom = top + 2 + Math.floor(Math.random()*3);
  const questions = {
    rectangle: { text: `长是 ${base} cm、宽是 ${height} cm 的长方形，面积是多少？`, answer: base*height, explain: `${base} × ${height} = ${base*height} cm²`, icon: '▭' },
    parallelogram: { text: `底是 ${base} cm、高是 ${height} cm 的平行四边形，面积是多少？`, answer: base*height, explain: `${base} × ${height} = ${base*height} cm²`, icon: '▱' },
    triangle: { text: `底是 ${base} cm、高是 ${height} cm 的三角形，面积是多少？`, answer: base*height/2, explain: `${base} × ${height} ÷ 2 = ${fmt(base*height/2)} cm²`, icon: '△' },
    trapezoid: { text: `上底 ${top} cm、下底 ${bottom} cm、高 ${height} cm 的梯形，面积是多少？`, answer: (top+bottom)*height/2, explain: `(${top} + ${bottom}) × ${height} ÷ 2 = ${fmt((top+bottom)*height/2)} cm²`, icon: '⏢' }
  };
  question = { ...questions[type], type };
  questionCount++;
  $('question-number').textContent = `${String(questionCount).padStart(2, '0')} / ∞`;
  $('question-icon').textContent = question.icon;
  $('question-text').textContent = question.text;
  $('answer-input').value = '';
  $('answer-feedback').textContent = '先动手算算看吧！';
  $('answer-feedback').className = 'feedback';
}

function checkAnswer() {
  const input = $('answer-input').value.trim();
  const feedback = $('answer-feedback');
  if (input === '') { feedback.textContent = '先输入你的答案。'; feedback.className = 'feedback incorrect'; return; }
  const correct = Math.abs(Number(input) - question.answer) < .0001;
  feedback.textContent = correct ? `答对了！${question.explain}` : `再试一次！提示：${lessons[question.type].formula}`;
  feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
}

$('new-question').addEventListener('click', newQuestion);
$('check-answer').addEventListener('click', checkAnswer);
$('answer-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
setShape('rectangle');
newQuestion();
