This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1) Create a project on Vercel and import this repository.

2) Set Environment Variables in Vercel Project Settings:

- `API_BASE`: Base URL of the Common Voice API (e.g. `https://api.commonvoice.mozilla.org`) used by the server proxy.
- (Optional) `NEXT_PUBLIC_API_BASE`: If you need to override from the client as well; otherwise proxy uses `API_BASE`.

3) Build & Output

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js version: 18 or 20 (default on Vercel)

4) Routes/Functions

- `app/api/proxy/[...slug]/route.ts`: Proxies requests to `API_BASE`. Requires `API_BASE`/`NEXT_PUBLIC_API_BASE`.
- `app/api/export/luo/route.ts`: Paginates Luo sentences through the proxy and returns a downloadable JSON. Long-running requests may require Pro plan if you increase `maxDuration`.

5) Usage after deploy

- Open the deployed URL, enter Client ID/Secret to get a token.
- Use “Fetch all to UI” to stream sentences into the page, then “Save JSON”.
- Or use “Export all Luo” for a direct server-generated JSON download.
