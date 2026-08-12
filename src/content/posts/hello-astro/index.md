---
title: このサイトの記事の書き方
description: フロントマターの各項目と、スラッグ・画像・外部リンクの扱いをまとめたテンプレート記事。
date: 2026-01-12
tags: [astro, meta]
featuredImage: ./cover.jpg
externalLink:
---

この記事自体がテンプレートです。`src/content/posts/hello-astro/index.md` に置かれているので、
スラッグは **ディレクトリ名** の `hello-astro` になります。

## スラッグの決まり方

ファイル名とディレクトリ名のどちらでもよく、次の 2 つは同じ URL になります。

```text
src/content/posts/hello-astro.md          → /posts/hello-astro
src/content/posts/hello-astro/index.md    → /posts/hello-astro
```

画像を増やしたくなったら、単一ファイルをディレクトリに変えて `index.md` にリネームするだけです。
URL は変わらないので、公開後でも移行できます。

## 画像はディレクトリに置く

`featuredImage: ./cover.jpg` のように相対パスで書くと、ビルド時に `astro:assets` が
リサイズ・フォーマット変換・ファイル名のハッシュ化まで行います。`public/` に置いた画像は
そのまま配信されるだけなので、記事に紐づく画像は記事のディレクトリに置くのがおすすめです。

本文中の画像も同じで、Markdown の相対パス参照が最適化の対象になります。

```markdown
![代替テキスト](./cover.jpg)
```

## 外部リンクにすると記事ページは作られない

`externalLink` に URL を入れると、その記事は**ページを生成せず**、アーカイブから
直接その URL へリンクします。読んだ記事や他媒体で書いた記事を並べるときに使います。
空のまま（またはキーごと省略）なら、通常のブログ記事として `/posts/<slug>` が生成されます。

## タグ

配列でもカンマ区切りでも書けます。

```yaml
tags: [astro, webgl]
tags: astro, webgl
```

## 下書き

`draft: true` を付けると `astro dev` では見えますが、本番ビルドからは
アーカイブ・タグ・RSS すべてで除外されます。
