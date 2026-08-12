---
title: スクロール演出を data 属性で宣言する
description: GSAP の設定を TypeScript 側に閉じ込めて、マークアップは Tailwind と data-* だけで完結させる構成のメモ。
date: 2026-03-18
tags: [gsap, webgl, motion]
---

演出のパラメータをマークアップ側の `data-*` に置き、実装は `src/lib/motion/` に集約しています。
`.astro` ファイルごとに `<script>` を書かずに済み、プリセット名の一覧も 1 箇所にまとまります。

```html
<h1 data-anim="fade-up">見出し</h1>

<ul data-anim="fade-up" data-anim-children="li" data-anim-stagger="0.06">
  <li>一つ目</li>
  <li>二つ目</li>
</ul>

<img src="/photo.jpg" alt="" data-parallax="0.2" />
```

## 初期状態を CSS に書かない

プリセットは `gsap.from()` の**開始値**として定義しています。到達点はマークアップそのままの状態なので、
JS が落ちても `prefers-reduced-motion: reduce` でも、内容は必ず読める状態で残ります。
`opacity: 0` を CSS に書いてしまうと、この保証が消えます。

## フォント読み込み後の再計算

日本語サブセットは重く、スワップした瞬間にレイアウトが動きます。ScrollTrigger の
start / end はレイアウトから計算されるので、`document.fonts.ready` の後に
`ScrollTrigger.refresh()` を呼んで測り直しています。

## WebGL は交差時に動的 import

シェーダーは `ogl` を使い、キャンバスがビューポートに近づいてから動的 `import()` しています。
背後には同じ見た目の CSS グラデーションを敷いてあるので、WebGL が無い環境でも崩れません。
