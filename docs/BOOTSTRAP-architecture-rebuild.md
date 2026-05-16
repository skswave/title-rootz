# Title Rootz — Architecture Rebuild Session

Read this file first, then read the full session prompt it references.

## What You're Doing

Rebuilding title.rootz.global from spaghetti (37 files in root, 160KB server.mjs) into a proper component architecture with git version control, following the freight-intel pattern.

## Read These In Order

1. **Session prompt**: `land-records/docs/SESSION-PROMPT-architecture-rebuild.md` — the FULL build plan with git init, component extraction, harvester framework, data model, and success criteria

2. **Architecture plan**: `land-records/docs/ARCHITECTURE-title-rootz-rebuild.md` — target file structure, component contracts, migration phases

3. **AI-native data model**: `land-records/docs/DESIGN-ai-native-data-model.md` — two-layer data model, template vs AI summaries, caching strategy

4. **Current state**: `land-records/CLAUDE.md` — what's deployed now, data inventory, cron schedule

5. **Reference architecture**: `freight-intel/CLAUDE.md` — the gold standard for Rootz service structure (or SSH: `cat /var/www/freight.rootz.global/CLAUDE.md`)

6. **What NOT to do**: Memory file `feedback_title_spaghetti_never_again.md` — no SSH code injection, no 3000-line files, test before deploy

7. **Steph's requirements**: `land-records/docs/MEETING-steph-rich-may16-analysis.md` — agents want Excel lists, title companies are the customer

## The Server

```
SSH:  ubuntu@141.148.25.214
Path: /var/www/title.rootz.global/
PM2:  title-records (port 3035)
Live: https://title.rootz.global
```

## Do NOT

- Inject code through SSH sed/Python heredocs
- Patch the existing server.mjs
- Deploy without `node --check`
- Write files over 500 lines
- Put business logic in server.js
