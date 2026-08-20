# Rename Safety

Use this checklist for implementation requests that change an existing name. Apply only the items relevant to the rename.

## Resolve consumers

- Check imports, exports, re-exports, and dynamic imports.
- Search identifiers, string references, templates, styles, tests, and snapshots.
- Check build configuration, routes, redirects, manifests, documentation, generated files, and generator configuration.
- Identify APIs, packages, analytics, persisted storage, bookmarks, inbound links, and other external consumers.
- For a case-only path rename on a case-insensitive filesystem, rename through an explicit intermediate path.

## Preserve compatibility

- Treat URLs, API fields, package names, environment variables, analytics names, and persisted keys as contracts.
- Add redirects, aliases, deprecation periods, or data migration when consumers cannot change atomically.
- Do not rename generated output directly; change its source or generator configuration.

## Verify

- Run targeted searches for the old name, allowing only intentional compatibility references.
- Run the repository's applicable formatter, type checker, tests, and build.
- Inspect the resulting route, asset, API, or other externally visible contract when applicable.
