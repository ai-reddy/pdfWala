# pdfWala

Every tool you need to work with PDFs, in one place — merge, split, compress,
convert, edit, and secure PDFs right in your browser.

Built as a document-processing platform on a single abstraction:

```
Tool → Job → Operation → Processing Engine → Result
```

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS**
- **pdf-lib** + **jszip** for PDF processing (pure JS, no native dependencies)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Working tools

Merge, Split (ranges / every-N / individual), Remove Pages, Extract Pages,
Organize, Rotate, Compress, JPG→PDF, Watermark, Page Numbers. Additional tools
appear in the catalog and are marked "Soon".

## Project structure

```
app/                     Next.js routes
  api/process/route.ts   Job endpoint (multipart → processed file)
  tools/[slug]/          Reusable tool page
components/ToolRunner.tsx Client tool shell (upload → options → download)
lib/
  types.ts               Domain types
  tools/catalog.ts        Full tool catalog
  engine/                 Operations + runOperation() entry point
```

## Deploy on Netlify

This repo includes `netlify.toml` configured with the official
`@netlify/plugin-nextjs` runtime. Connect the repository in Netlify and it builds
automatically with:

- Build command: `npm run build`
- Publish directory: `.next`
