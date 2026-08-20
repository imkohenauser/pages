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

投稿は `src/content/writing/<slug>/index.md` に置きます。同じディレクトリの画像は相対パスで参照できます。公開 URL は `/{slug}/` です（本番では `base` が前置されます）。`/posts/{slug}/` は互換のため `/{slug}/` へリダイレクトします。`writing`、`posts`、`projects` は予約済みのためスラッグに使えません。

`externalUrl` がある投稿は外部リンクとして一覧にだけ表示され、投稿ページを生成しません。ホスト名から Medium / Zenn / GitHub を判定して一覧のマークを出します。

プロジェクトは `src/content/projects/<slug>/index.md` に置きます。詳細ページと `/projects` はまだ生成しません。`githubUrl` と `officialSiteUrl` のいずれか（または両方）を設定します。`officialSiteIcon` はリモート URL、またはエントリ隣の `./icon.svg` のような相対パスです。

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

```yaml
---
title: "Project"
description: "Description"
publishedAt: 2026-08-18
updatedAt:
featuredImage:
featuredImageAlt:
githubUrl: https://github.com/example/project
officialSiteUrl: https://example.com/
officialSiteIcon: ./icon.svg
lang: en
draft: false
---
```

プロフィールとサイト情報は `src/data/site.ts` で管理します。

初期値のサイト名・紹介文、サンプル投稿・プロジェクトは公開前に差し替えてください。

## Deploy

`main` への push で GitHub Pages を更新します。GitHub の Settings → Pages → Source を `GitHub Actions` に設定してください。
