// =============================================================================
// Freewrite CMS Client
// =============================================================================
//
// Copy-paste this file into your project's `lib/` directory.
//
// Requirements:
//   - Set the FREEWRITE_API_KEY environment variable
//
// Usage:
//   import { fetchFreewriteCMS } from '@/lib/freewritecms';
//
//   const data = await fetchFreewriteCMS({
//     query: `query { changelogs { edges { node { id title content } } } }`,
//     revalidate: 60,
//   });
//
// =============================================================================

// ---------------------------------------------------------------------------
// Block Editor Types
// ---------------------------------------------------------------------------

export type BlockType =
    | "paragraph"
    | "heading"
    | "image"
    | "code"
    | "list"
    | "quote"
    | "divider";

export interface Block {
    id: string;
    type: BlockType;
    content: BlockContent;
    metadata?: Record<string, unknown>;
}

export type BlockContent =
    | ParagraphContent
    | HeadingContent
    | ImageContent
    | CodeContent
    | ListContent
    | QuoteContent
    | DividerContent;

export interface ParagraphContent {
    text: string;
    formatting?: TextFormatting[];
}

export interface HeadingContent {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    formatting?: TextFormatting[];
}

export interface ImageContent {
    url: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
}

export interface CodeContent {
    code: string;
    language?: string;
}

export interface ListContent {
    type: "ordered" | "unordered";
    items: string[];
}

export interface QuoteContent {
    text: string;
    author?: string;
}

export interface DividerContent {
    style?: "solid" | "dashed" | "dotted";
}

export interface TextFormatting {
    type: "bold" | "italic" | "underline" | "strikethrough" | "code" | "link";
    start: number;
    end: number;
    url?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const FREEWRITE_CMS_API_URL = "https://www.freewritecms.com/api/graphql";

export interface FreewriteCMSOptions {
    /** The GraphQL query string */
    query: string;
    /** Optional GraphQL variables */
    variables?: Record<string, unknown>;
    /**
     * Next.js ISR revalidation interval in seconds.
     * Set to `0` to disable caching, or `false` to cache indefinitely.
     * @default 60
     */
    revalidate?: number | false;
    /**
     * Override the API key (defaults to FREEWRITE_API_KEY env var).
     * Useful for multi-tenant setups or testing.
     */
    apiKey?: string;
    /**
     * Override the API URL (defaults to https://www.freewritecms.com/api/graphql).
     */
    apiUrl?: string;
}

export interface FreewriteCMSResponse<T = unknown> {
    data: T;
    errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

/**
 * Fetch data from Freewrite CMS via its GraphQL API.
 *
 * Works in Next.js server components, API routes, and any server-side context.
 *
 * @example
 * ```ts
 * const { data } = await fetchFreewriteCMS<{ changelogs: { edges: ChangelogEdge[] } }>({
 *   query: CHANGELOGS_QUERY,
 * });
 * ```
 */
export async function fetchFreewriteCMS<T = unknown>(
    options: FreewriteCMSOptions
): Promise<FreewriteCMSResponse<T>> {
    const {
        query,
        variables,
        revalidate = 60,
        apiKey = process.env.FREEWRITE_API_KEY,
        apiUrl = FREEWRITE_CMS_API_URL,
    } = options;

    if (!apiKey) {
        throw new Error(
            "[freewritecms] Missing API key. Set the FREEWRITE_API_KEY environment variable or pass `apiKey` in options."
        );
    }

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query, variables }),
        next:
            revalidate === false
                ? { revalidate: false }
                : { revalidate: revalidate },
    });

    if (!response.ok) {
        throw new Error(
            `[freewritecms] API request failed with status ${response.status}: ${response.statusText}`
        );
    }

    const json = await response.json();

    if (json.errors?.length) {
        console.error("[freewritecms] GraphQL errors:", json.errors);
    }

    return json as FreewriteCMSResponse<T>;
}
