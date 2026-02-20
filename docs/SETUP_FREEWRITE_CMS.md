# Setup Freewrite CMS

This project uses [Freewrite CMS](https://freewritecms.com) to manage content like changelogs, blog posts, and documentation pages. The integration follows the **shadcn philosophy** — two copy-paste files you own and can customize freely.

## Files

| File | Purpose |
|------|---------|
| `lib/freewritecms.ts` | Types + `fetchFreewriteCMS()` client |
| `components/freewritecms-block-renderer.tsx` | Block content → React component renderer |

## Setup

### 1. Get your API key

1. Go to [Freewrite CMS](https://freewritecms.com) and sign in
2. Navigate to your project settings
3. Generate or copy your API key

### 2. Add the environment variable

Add the following to your `.env.local`:

```env
FREEWRITE_API_KEY=your-freewrite-api-key
```

### 3. You're done

The two files (`lib/freewritecms.ts` and `components/freewritecms-block-renderer.tsx`) are already in the project. No packages to install.

## Usage

### Fetching content

Use `fetchFreewriteCMS()` in any **server component** or **API route**:

```tsx
import { fetchFreewriteCMS, type Block } from "@/lib/freewritecms";

// Define the shape of your response
interface ChangelogNode {
  id: string;
  title: string;
  content: Block[];
  publishedAt: string;
}

interface ChangelogsData {
  changelogs: {
    edges: Array<{ node: ChangelogNode }>;
  };
}

// Fetch with full type safety
const { data } = await fetchFreewriteCMS<ChangelogsData>({
  query: `
    query GetChangelogs {
      changelogs {
        edges {
          node {
            id
            title
            content
            publishedAt
          }
        }
      }
    }
  `,
  revalidate: 60, // ISR: revalidate every 60 seconds
});
```

### Rendering block content

```tsx
import { FreeWriteCmsBlockRenderer } from "@/components/freewritecms-block-renderer";
import type { Block } from "@/lib/freewritecms";

<FreeWriteCmsBlockRenderer blocks={content as Block[]} />

// With custom wrapper class
<FreeWriteCmsBlockRenderer blocks={content as Block[]} className="prose" />
```

### Supported block types

The renderer handles the following block types out of the box:

| Block Type | Renders As |
|------------|------------|
| `paragraph` | `<p>` |
| `heading` | `<h1>` – `<h6>` |
| `image` | `<figure>` with `<img>` and optional `<figcaption>` |
| `code` | `<pre><code>` |
| `list` | `<ol>` or `<ul>` |
| `quote` | `<blockquote>` with optional author |
| `divider` | `<hr>` |

## Options

`fetchFreewriteCMS()` accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `query` | `string` | *required* | GraphQL query string |
| `variables` | `Record<string, unknown>` | `undefined` | GraphQL variables |
| `revalidate` | `number \| false` | `60` | Next.js ISR revalidation interval in seconds |
| `apiKey` | `string` | `process.env.FREEWRITE_API_KEY` | Override API key |
| `apiUrl` | `string` | `https://www.freewritecms.com/api/graphql` | Override API URL |

## Customization

Since you own the code, customize freely:

- **Swap `<img>` for Next.js `<Image>`** — edit the `image` case in `BlockDisplay` inside the renderer
- **Add syntax highlighting** — integrate a library like `shiki` or `prism` in the `code` case
- **Custom block types** — add new cases to the `switch` statement in `BlockDisplay`
- **Styling** — all classes use shadcn CSS variables (`text-muted-foreground`, `bg-muted`, etc.), so they automatically follow your theme

## Example: Changelog page

See `app/(public)/changelog/page.tsx` for a complete working example.

## Adding to a new project

To use this integration in another project:

1. Copy `lib/freewritecms.ts` into your project's `lib/` directory
2. Copy `components/freewritecms-block-renderer.tsx` into your project's `components/` directory
3. Ensure your project has the `cn()` utility (standard in any shadcn project — `lib/utils.ts`)
4. Set the `FREEWRITE_API_KEY` environment variable
