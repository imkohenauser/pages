---
name: web-naming-conventions
description: Choose, review, or safely rename web-project identifiers, paths, assets, routes, and public contracts. Use when the task is primarily about naming; do not invoke for ordinary implementation that merely introduces names.
---

# Web Naming Conventions

Choose names that communicate domain meaning and remain consistent with the project.

## Workflow

1. Inspect the repository's explicit rules, tooling, nearby code, and established vocabulary.
2. Identify whether the name is internal or a contract used by URLs, APIs, packages, analytics, tests, storage, or external consumers.
3. Prefer, in order: explicit project rules; compatibility requirements; consistent local usage; repository-wide usage; the defaults in [references/conventions.md](references/conventions.md). Read the reference only when the repository does not settle the choice or the task reviews conventions across multiple naming surfaces.
4. Recommend one best name. Mention alternatives only when they represent a meaningful semantic choice.
5. For an implementation, update all in-scope references and run relevant checks. When changing an existing name, also read and follow [references/rename-safety.md](references/rename-safety.md).
6. For a review, do not edit. For each material issue, report the current name and location, the problem, the recommended name, and any compatibility or migration risk.

## Constraints

- Preserve a project's coherent convention even when another convention is also reasonable.
- Name the domain concept, role, result, or contract rather than its current implementation.
- Do not normalize unrelated names or expand a rename beyond the requested scope.
- Treat public names and dynamically constructed references as migration risks. Search for consumers before changing them.
