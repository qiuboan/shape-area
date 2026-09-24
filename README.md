# 图形动起来 · 面积看得见

面向五年级学生的互动数学网站。通过数方格、平移与旋转拼接，探索长方形、平行四边形、三角形和梯形的面积公式，并用随机题目练习。

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
