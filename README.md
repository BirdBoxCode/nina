# Artist Split-Hero Website

A Next.js (App Router) website featuring a cinematic split-screen landing page and two distinct sub-sites (Art & Tattoo) within a single codebase, managed by Middleware and subdomains.

## Features

- **Split Hero Landing**: Interactive 100vh dual-panel entry with physics-based parallax mouse movement.
- **Domain Routing**: `example.com` -> Landing, `art.example.com` -> Art site, `tattoo.example.com` -> Tattoo site.
- **Shared Components**: Reusable UI with variants logic.
- **Tech Stack**: Next.js 16/14, Tailwind CSS 4, Framer Motion, TypeScript.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Local Domains

To test the subdomain features locally, you must map the subdomains to localhost in your `/etc/hosts` file.

**Mac/Linux:**

1. Open terminal.
2. Run `sudo nano /etc/hosts`.
3. Add the following lines:
   ```
   127.0.0.1 art.localhost
   127.0.0.1 tattoo.localhost
   ```
4. Save and exit (Ctrl+O, Enter, Ctrl+X).

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access the Sites

- **Main Landing**: [http://localhost:3000](http://localhost:3000)
- **Art Subdomain**: [http://art.localhost:3000](http://art.localhost:3000)
- **Tattoo Subdomain**: [http://tattoo.localhost:3000](http://tattoo.localhost:3000)

## Deployment (Vercel)

1. Push code to GitHub.
2. Import project to Vercel.
3. In Vercel Project Settings > Domains:
   - Add your main domain (e.g., `yourname.com`).
   - Add subdomains: `art.yourname.com` and `tattoo.yourname.com`.
   - Vercel automatically routes all of them to the same deployment.
4. The `middleware.ts` will detect the hostname and render the correct version.

## Project Structure

- `middleware.ts`: Handles hostname detection and sets `x-site-variant` header.
- `app/page.tsx`: Smart home page that decides what to render based on the header.
- `components/MainSplitHero.tsx`: The complex landing interaction.
- `lib/constants.ts`: Site-specific content configuration.
