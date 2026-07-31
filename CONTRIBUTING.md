# Contributing

Thanks for your interest in **Live Session Clock**! Contributions, bug reports,
and ideas are all welcome.

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ (the repo pins Node 20 via
`.node-version`).

```bash
git clone https://github.com/coolmukky/live-session-clock.git
cd live-session-clock
npm install
npm run dev        # http://localhost:5173
```

## Handy scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Run the unit tests (Vitest) |
| `npm run build` | Type-check (`tsc --noEmit`) + production build to `dist/` |
| `npm run preview` | Serve the production build (closest to deployed) |

## Making a change

1. **Fork** the repo and create a branch: `git checkout -b my-change`.
2. Make your change. Please keep the existing style — TypeScript, small focused
   components, and the plain-CSS design tokens in `src/index.css` (the
   `--accent`, `--bg`, … custom properties).
3. **Add or update tests** for anything with logic. The pure timing engine lives
   in `src/engine.ts` (`computeSnapshot`) precisely so it can be unit-tested
   without a renderer — see `src/**/*.test.ts` for the pattern.
4. Make sure everything is green locally:
   ```bash
   npm test && npm run build
   ```
   CI runs the same checks on every push and **must pass before the site
   deploys**.
5. Open a pull request with a clear description of what and why.

## Design principles

- **No backend, no accounts.** Everything runs in the browser; state is saved to
  `localStorage`. Keep it that way.
- **Dependency-light.** The only runtime dependency beyond React is
  `qrcode-generator`. Prefer the platform (Web Audio, Service Worker,
  Notifications, Fullscreen, Wake Lock APIs) over new packages.
- **Accessible.** Preserve focus management, `aria-live` announcements, visible
  focus rings, and `prefers-reduced-motion` support.
- **Works at any base path.** The Vite `base` is relative (`./`) so the build
  runs at a domain root or a sub-path — don't hardcode absolute asset URLs.

## Project layout

See the **Project structure** section in the [README](README.md#-project-structure)
for a file-by-file map.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
