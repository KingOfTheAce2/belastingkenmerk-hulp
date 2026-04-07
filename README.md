# BetalingskenmerkHulp

Convert Dutch tax assessment numbers (*aanslagnummers*) into payment references (*betalingskenmerken*) and generate ready-to-send client emails — all inside your browser.

> **Try it live:** [kingoftheace2.github.io/belastingkenmerk-hulp](https://kingoftheace2.github.io/belastingkenmerk-hulp/)

---

## Features

- **Aanslagnummer → betalingskenmerk** conversion with Mod-11 check digit (VpB, BTW, LB, IB)
- **Payment deadline** auto-calculated from the assessment date (6 weeks - 1 day)
- **Draft emails** in Dutch and English, ready to copy-paste
- **100 % client-side** — no data leaves your browser

## Getting Started

```bash
npm install
npm run dev        # → http://localhost:3000
```

## Build

```bash
npm run build      # output in dist/
npm run preview    # preview the production build locally
```

## Deployment (GitHub Pages)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

To enable it, go to **Settings → Pages → Source** and select **GitHub Actions**.

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| Build | Vite |

## License

Apache-2.0
