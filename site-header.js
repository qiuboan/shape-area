class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.firstElementChild) return;
    this.innerHTML = `
      <header class="site-header">
        <a class="brand" href="#menu" aria-label="问茶研究室，返回菜单"><span class="brand-icon">◩</span><span>问茶研究室</span></a>
        <nav aria-label="主导航">
          <a href="#menu">首页菜单</a>
          <a href="#explore">动手探索</a>
          <a href="#ideas">运动方法</a>
          <a href="#challenge">闯关练习</a>
        </nav>
      </header>`;
  }

  setActivePage(page) {
    for (const link of this.querySelectorAll('nav a')) {
      if (link.getAttribute('href') === `#${page}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
}

customElements.define('site-header', SiteHeader);
