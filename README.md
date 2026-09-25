# 图形动起来 · 面积看得见

面向五年级学生的互动数学网站。页面打开时，10 × 10 方格纸保持空白。长、宽两根蓝条都从 5 cm 开始；拖动各自的紫色圆点，可以在 1–10 cm 之间以 0.1 cm 为步长调节。把蓝条拖到方格纸上后，两根蓝条会对齐起点并围成长方形，页面显示面积和计算式。支持鼠标、触屏和键盘操作，也可清空方格重新开始。页面另有面积练习及平移、旋转、轴对称的介绍。

## 本地运行

项目仅使用原生 HTML、CSS 和 JavaScript。可直接用浏览器打开 `index.html`，或在项目目录运行：

```sh
python3 -m http.server 8000
```

访问 `http://localhost:8000`。

## 检查和构建

```sh
npm run check
npm run build
```

构建产物位于 `dist/`。

## 部署到 Cloudflare Pages

仓库包含 `wrangler.toml`，构建命令为 `npm run build`，输出目录为 `dist`。也可以使用 Wrangler 手动部署：

```sh
npm run build
npx wrangler pages deploy dist --project-name shape-motion-area
```

网站没有服务端依赖，也不需要密钥。
