# BetterClean Codex Adapter

This repository is governed by Ven's Open Brain system. Do not treat this file
as an independent source of live priorities or project facts.

## Startup

1. Read `/Users/venm3/Desktop/Ven AI/OPEN_BRAIN.md`.
2. Follow `/Users/venm3/Desktop/Ven AI/AGENTS.md` and the Codex/Forge role it
   assigns.
3. Read `PROJECT.md` for this repository's technical facts and commands.
4. Before editing, inspect both repositories with `git status`, `git log -10`,
   and `node "/Users/venm3/Desktop/Ven AI/scripts/task_guard.mjs" list`.
5. Acquire an Open Brain claim covering this repository and every other path
   the task will mutate.

## Safety

- Questions, reviews, plans, and suggestions are not authorization to edit,
  push, deploy, send, import, or change production.
- Never use broad staging such as `git add -A` or `git add .`. Stage only the
  reviewed files or hunks belonging to the task.
- Never use `git checkout --`, `git restore`, `git reset`, `git clean`, or any
  other command that can discard unexplained work.
- Inspect `git diff --cached` before every commit. Prefix Codex commits with
  `Forge:`.
- A push to `main` can trigger the production Vercel project. It requires the
  current task's explicit production authorization and a valid Open Brain
  production operation/preflight.
- Select skills from the Open Brain skill registry when the task actually
  matches them. No repository-local skill is mandatory for unrelated work.

Pricing and other mutable technical facts belong in their canonical sources
identified by `PROJECT.md`, not in this adapter.
