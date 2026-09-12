---
name: commit-ja
description: Write Japanese Conventional Commit messages from staged changes. Use when invoked as `$commit-ja` or `/commit-ja`, attached as a skill, or named as the project's commit convention. Create commits when requested.
license: MIT
disable-model-invocation: true
---

# Japanese Commit Message

Generate a message now when invoked on its own. Empty input or a skill reference alone counts, even if the client omits the command text. When supplied as context for another request, follow that request.

## Generate

1. Read `git status --short`, `git diff --cached --stat`, `git diff --cached`, and `git log -8 --format='%s'` in parallel.
2. Base the message on staged changes; use recent subjects for style. Skip the history if the repository has no commits. Read more context only as needed.
3. Return only the message in one `text` code block. If nothing is staged, return `ステージ済みの変更はありません` in that block. If inspection fails, report the error.

Leave files and the index unchanged when generating a message. Finish with the result, not an acknowledgment or a request to invoke again.

## Message format

Use `type(scope)!: subject`:

- Type: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, or `revert`.
- Use English for type and scope; Japanese for subject and body. Include scope when the diff supports it.
- Describe the resulting behavior with a concise noun phrase. Include meaningful terms, rather than filenames or generic words such as `修正` alone.
- Aim for 50 characters; limit the subject to 72. Omit final punctuation, ticket numbers, URLs, and `〜しました`.
- Add a body when motivation or impact needs explanation.
- Mark breaking changes with `!`; add a `BREAKING CHANGE:` footer when migration needs explanation.

Split independent concerns into separate messages, separated by `---` within the same block. Keep supporting tests and documentation with their change.

```text
feat(auth): OAuth2ログインエンドポイントの追加

リフレッシュトークンを使ったセッション継続に対応。
```

## Commit

Create commits only when requested. Inspect staged and relevant unstaged changes, then stage the requested paths or hunks while preserving unrelated and partially staged work.

Do not use blanket staging, create empty commits, or bypass hooks.

Group independent concerns separately. Check each staged diff and required repository checks, commit with a message in the format above, and verify the commit and remaining Git state. Pass plain message text to Git. Report any commit or hook failure.
