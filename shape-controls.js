class ShapeControls extends HTMLElement {
  connectedCallback() {
    if (this.firstElementChild) return;
    this.classList.add('lab-sidebar');
    this.setAttribute('role', 'complementary');
    this.setAttribute('aria-labelledby', 'dimension-title');
    this.innerHTML = `
            <div class="sidebar-heading"><h3 id="dimension-title">控制台</h3><span class="pill" id="dimension-pill">长方形</span></div>
            <div class="dimension-control" data-dimension="length"><div class="dimension-heading"><strong id="length-label">长</strong></div><div class="dimension-ruler"><div class="ruler-bar" id="length-bar" aria-hidden="true"></div></div><div class="range-wrap"><output id="length-value" for="length-range">5</output><input id="length-range" type="range" min="1" max="10" step="1" value="5" aria-label="长，1 到 10 厘米"><div class="range-ends"><span>1</span><span id="length-max-label">10</span></div></div></div>
            <div class="dimension-control" data-dimension="width"><div class="dimension-heading"><strong id="width-label">宽</strong></div><div class="dimension-ruler"><div class="ruler-bar" id="width-bar" aria-hidden="true"></div></div><div class="range-wrap"><output id="width-value" for="width-range">5</output><input id="width-range" type="range" min="1" max="10" step="1" value="5" aria-label="宽，1 到 10 厘米"><div class="range-ends"><span id="width-min-label">1</span><span id="width-max-label">10</span></div></div></div>
            <div class="dimension-control" id="height-control" data-dimension="height" hidden><div class="dimension-heading"><strong id="height-label">高</strong></div><div class="dimension-ruler"><div class="ruler-bar" id="height-bar" aria-hidden="true"></div></div><div class="range-wrap"><output id="height-value" for="height-range">5</output><input id="height-range" type="range" min="1" max="10" step="1" value="5" aria-label="高，1 到 10 厘米"><div class="range-ends"><span>1</span><span>10</span></div></div></div>
            <button id="reset-board" class="reset-button" type="button">恢复原状</button>
          `;
  }

  setShape(shape) {
    const config = {
      rectangle: ['长方形', '长', '宽'],
      parallelogram: ['平行四边形', '底', '高'],
      triangle: ['三角形', '底', '高'],
      trapezoid: ['等腰梯形', '上底', '下底']
    }[shape];
    this.querySelector('#dimension-pill').textContent = config[0];
    this.querySelector('#length-label').textContent = config[1];
    this.querySelector('#width-label').textContent = config[2];
    this.querySelector('#height-control').hidden = shape !== 'trapezoid';
  }
}

customElements.define('shape-controls', ShapeControls);
