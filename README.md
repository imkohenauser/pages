# imkohenauser.com

Kohei Saito の個人サイトです。Astro で構築し、GitHub Pages から配信します。

## Development

```sh
npm ci
npm run dev
npm run check
npm run build
```

投稿は `src/content/writing/<slug>/index.md`、プロジェクトは `src/content/projects/<slug>/index.md` に置きます。プロフィールとサイト情報は `src/data/site.ts` で管理します。

## Trust boundary

- オーナーは、コンテンツ、リポジトリ、GitHub の設定、デプロイを管理します。
- ローカルの AI エージェントは、オーナーが許可した作業範囲で、追跡対象外のローカルファイルを含むワークスペースを扱う場合があります。秘密情報はリポジトリへ保存しません。
- GitHub 上のエージェントと Actions は、コミットされた内容と、明示的に付与された権限だけを扱います。CI は読み取り専用で、Pages の書き込み権限はデプロイ時だけ使用します。
- サイト訪問者にはビルド成果物が配信されます。リポジトリ閲覧者にはコミットと履歴が公開されるため、コミットした内容はすべて公開情報として扱います。

`draft: true` はサイトへの出力を止めるだけで、公開リポジトリ上のファイルを非公開にはしません。

## Deploy

`Deploy` workflow を手動実行すると、`imkohenauser.com` 向けの GitHub Pages を公開します。
