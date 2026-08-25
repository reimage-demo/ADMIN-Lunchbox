# Lunch Box admin portal

This repository deploys only the Lunch Box React admin portal. It follows the
same split used by `reimage-demo/the-patio-ADMIN` and publishes the compiled
Vite `dist/` artifact to GitHub Pages at `https://admin.lunchboxct.com/`.

The portal connects to the Lunch Box production Convex deployment through the
repository Actions secret `VITE_CONVEX_URL`. Admin authentication and all order
mutations remain server-validated in Convex.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm ci
VITE_CONVEX_URL=https://your-deployment.convex.cloud npm run build
```
