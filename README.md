# pages

Astro で構築する Markdown 投稿型の個人サイトです。

## Requirements

- Node.js 24.19.0
- npm 11.19.0

Volta は `package.json` の pin を自動的に使用します。その他のバージョンマネージャーは `.node-version` を使用できます。

## Commands

```sh
npm ci
npm run dev
npm run build
npm run check
```

## Content

投稿は `src/content/posts/<slug>/index.md` に置きます。同じディレクトリの画像は相対パスで参照できます。公開 URL は `/{slug}/` です（本番では `base` が前置されます）。`writing` と `posts` は予約済みのためスラッグに使えません。

`externalUrl` がある投稿は外部リンクとして一覧にだけ表示され、投稿ページを生成しません。

```yaml
---
title: "Title"
description: "Description"
publishedAt: 2026-08-12
updatedAt:
featuredImage:
featuredImageAlt:
externalUrl:
lang: ja
canonicalUrl:
noindex: false
draft: false
---
```

プロフィールとサイト情報は `src/data/site.ts` で管理します。

初期値のサイト名・紹介文、サンプル投稿・プロジェクトは公開前に差し替えてください。

## Deploy

`main` への push で GitHub Pages を更新します。GitHub の Settings → Pages → Source を `GitHub Actions` に設定してください。
