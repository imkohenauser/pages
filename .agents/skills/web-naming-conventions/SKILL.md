---
name: web-naming-conventions
description: Choose, review, or safely rename identifiers, files, directories, assets, routes, and related names in web projects. Use when implementing or reviewing naming, or when defining a project's naming conventions.
---

# Web Naming Conventions

Choose names that communicate domain meaning and remain consistent with the project.

## Workflow

1. Inspect the repository's explicit rules, tooling, nearby code, and established vocabulary.
2. Identify whether the name is internal or a contract used by URLs, APIs, packages, analytics, tests, storage, or external consumers.
3. Prefer, in order: explicit project rules; compatibility requirements; consistent local usage; repository-wide usage; the defaults in [references/conventions.md](references/conventions.md).
4. Recommend one best name. Mention alternatives only when they represent a meaningful semantic choice.
5. For implementation requests, update all in-scope references and run relevant checks. For review requests, report findings without editing.

## Constraints

- Preserve a project's coherent convention even when another convention is also reasonable.
- Name the domain concept, role, result, or contract rather than its current implementation.
- Do not normalize unrelated names or expand a rename beyond the requested scope.
- Treat public names and dynamically constructed references as migration risks. Search for consumers before changing them.
- Do not derive accessible text such as image `alt` text from filenames; name files and author accessibility text for their different purposes.

Read [references/conventions.md](references/conventions.md) when the repository does not settle the choice or when reviewing conventions across multiple naming surfaces.
