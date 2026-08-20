# pages

Astro で構築する Markdown 投稿型の個人サイトです。

## Commands

```sh
npm install
npm run dev
npm run build
npm run check
```

## Content

投稿は `src/content/posts/<slug>/index.md` に置きます。同じディレクトリの画像は相対パスで参照できます。

`externalUrl` がある投稿は外部リンクとして一覧にだけ表示され、投稿ページを生成しません。

```yaml
---
title: "Title"
description: "Description"
publishedAt: 2026-08-12
updatedAt:
tags: []
featuredImage:
featuredImageAlt:
externalUrl:
draft: false
---
```

プロフィールとプロジェクトは `src/data/site.ts` で管理します。

初期値の `Name`、`Short bio.`、サンプル投稿・プロジェクトは公開前に差し替えてください。

## Deploy

`main` への push で GitHub Pages を更新します。GitHub の Settings → Pages → Source を `GitHub Actions` に設定してください。
