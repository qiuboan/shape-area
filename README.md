# 图形动起来 · 面积看得见

面向五年级学生的互动数学网站。页面打开时，10 × 10 方格纸直接显示长和宽都是 5 cm 的蓝色长方形。旁边的长、宽数值条各固定 10 格，蓝格表示当前边长，白格表示剩余长度；拖动紫色圆点，可在 1–10 cm 之间以 1 cm 为步长调节整数边长，图形与面积会立即更新。支持鼠标、触屏和键盘操作，也可恢复初始 5 × 5 图形。页面另有面积练习及平移、旋转、轴对称的介绍。

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
