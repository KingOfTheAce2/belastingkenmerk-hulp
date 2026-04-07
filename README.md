# BetalingskenmerkHulp

A browser-based tool that converts Dutch tax assessment numbers (aanslagnummers) into payment references (betalingskenmerken) and generates draft emails for clients.

**Live:** [https://kingoftheace2.github.io/belastingkenmerk-hulp/](https://kingoftheace2.github.io/belastingkenmerk-hulp/)

## Features

- Convert aanslagnummers to betalingskenmerken (supports VpB, BTW, LB and IB)
- Auto-calculate payment deadlines (6 weeks - 1 day)
- Generate draft client emails in Dutch and English
- All processing happens locally in the browser — no data is stored or sent anywhere

## Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Deploy to GitHub Pages

The project uses Vite and is configured to deploy to GitHub Pages.

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. The output is in the `dist/` folder, ready to be served as a static site.

To automate deployment, add a GitHub Actions workflow (see below) or use `gh-pages`:

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

### GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

Then enable GitHub Pages in your repo settings under **Pages → Source → GitHub Actions**.

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4
- Framer Motion (via `motion`)
- Lucide React icons
