---
name: commit-ja
description: Propose a Japanese Conventional Commit message from staged changes. Use only when explicitly invoked as `$commit-ja` or `/commit-ja`.
---

# Japanese Commit Message

Propose commit text for the staged changes. Read Git state only; do not edit files, change the index, or create a commit.

## Inspect

Run these commands in parallel and do not inspect anything else unless the staged diff is insufficient:

- `git status --short`
- `git diff --cached --stat`
- `git diff --cached`
- `git log -8 --format='%s'`

Use only the staged diff as the source of truth. Ignore unstaged and untracked changes. Use recent commit subjects only to match the repository's established message style; do not search for additional commit conventions.

If there are no staged changes, output `ステージ済みの変更はありません` and stop.

If paths and diff hunks do not provide enough context for an accurate message, read at most one relevant file.

## Compose

Use the Conventional Commits form `type(scope)!: subject`:

- Choose one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, or `revert`.
- Add a scope only when it is clear from the staged paths or diff.
- Add `!` immediately after the type or scope for a breaking change. Add a `BREAKING CHANGE:` footer when the migration impact needs explanation.
- Write the type and scope in English. Write the subject and body in Japanese.
- Describe the result of applying the commit, not the editing process.
- Write the subject as a concise Japanese noun phrase. Do not use `〜しました`.
- Include meaningful domain or behavior terms; do not use only generic words such as `修正` or `更新`, and do not list filenames as the subject.
- Do not end the subject with punctuation. Aim for 50 characters and never exceed 72 characters.
- Keep ticket numbers and URLs out of the subject.
- Add a body only when it clarifies motivation, behavior, or impact. Do not narrate implementation details.

Prefer one message. If the staged diff clearly combines independently committable concerns with different types, output one message for each proposed commit and separate them with `---`.

## Output

Output only the proposed message text. Do not add a code fence, introduction, explanation, conclusion, or reasoning.

Example:

```text
feat(auth): OAuth2ログインエンドポイントの追加

リフレッシュトークンを使ったセッション継続に対応。
```
