---
title: 下書きの例
description: draft を立てた記事は astro dev では見えますが、本番ビルドには含まれません。
date: 2026-04-01
tags: [meta]
draft: true
---

`pnpm dev` では一覧に出ますが、`pnpm build` では除外されます。
公開するときに `draft: true` を消してください。
