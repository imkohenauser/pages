# Renaming

- Find consumers in code, strings, templates, styles, tests, configuration, and documentation. Include dynamically constructed references.
- Update generated names at their source.
- For case-only path changes on case-insensitive filesystems, rename through an intermediate path.
- For published URLs, APIs, packages, analytics, or stored keys, use redirects, aliases, or migrations where consumers cannot change together. Repository search does not cover external consumers.
- Search for remaining uses of the old name, allowing intentional compatibility references, and run relevant checks.
