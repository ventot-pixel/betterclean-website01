# BetterClean Website

## Identity

- Business: BetterClean, Tampere, Finland
- Canonical local repository: `/Users/venm3/Business/Finland/BetterClean/Better Clean/Better Clean Website`
- GitHub: `ventot-pixel/betterclean-website01`
- Default and Vercel production branch: `main`
- Live domain: `https://www.betterclean.fi`
- Open Brain project ID: `betterclean-website`

## Architecture

The customer-facing site is primarily static HTML, CSS, and vanilla JavaScript,
but it is not frontend-only. `api/lead.js` is the Vercel lead-delivery backend.
The repository also contains tests, document/flyer generators, internal guides,
and an `internal-tools/` application prototype. Inspect the current tree instead
of relying on a fixed page count.

## Canonical facts

- `pricing.js` is the single source of truth for current numeric prices,
  frequency tiers, minimum durations, fixed-price items, and add-ons.
- `PRODUCT.md` owns stable product behavior and customer-facing constraints.
- Open Brain owns authorization, active priorities, project identity, task
  claims, production operations, and cross-agent coordination.
- Provider memory and generated handoffs are caches, never canonical truth.

## Commands

```bash
npm test
npm run check
node serve.mjs
```

Use a task-specific temporary npm cache for one-off `npx` validation when the
user cache is not writable. Visual checks must use localhost, not `file://`.

## Production boundary

A push to `main`, Vercel deployment, GitHub Actions dispatch, GitHub secret
change, customer message, lead write, or other production action requires
explicit current-task authorization plus the Open Brain claim, operation ID,
and production preflight. Do not infer that authorization from a requested
review, local edit, plan, or commit.
