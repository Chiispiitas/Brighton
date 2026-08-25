# Horizons tools

Dependency-free helper scripts for production workflow.

## Create a lesson record from the locked syllabus

From the `Horizons/` directory:

```bash
node tools/new-lesson.mjs 2 B
```

This reads `content/syllabus-lock.json` and creates:

`content/u02-b.json`

with the exact locked:

- title;
- focus/objectives;
- real-world context;
- two-page structure.

It refuses to overwrite an existing record.

## Validate a lesson record

```bash
node qa/validate-content.mjs content/u02-b.json
```

or for the included example:

```bash
npm run validate:example
```

The scaffold is deliberately layout-neutral. It does not choose final exercises or generate a generic page design; art direction still happens in HTML/CSS using the production system.
