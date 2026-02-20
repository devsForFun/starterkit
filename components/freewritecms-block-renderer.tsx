// =============================================================================
// Freewrite CMS Block Renderer
// =============================================================================
//
// Copy-paste this file into your project's `components/` directory.
//
// Requirements:
//   - lib/freewritecms.ts  (types)
//   - lib/utils.ts         (cn helper — standard in shadcn projects)
//   - Tailwind CSS with shadcn CSS variables (--muted, --primary, etc.)
//
// Usage:
//   import { FreeWriteCmsBlockRenderer } from '@/components/freewritecms-block-renderer';
//   import type { Block } from '@/lib/freewritecms';
//
//   <FreeWriteCmsBlockRenderer blocks={content as Block[]} />
//
// =============================================================================

/* eslint-disable @next/next/no-img-element */
import React from "react";
import { cn } from "@/lib/utils";
import type {
    Block,
    HeadingContent,
    ImageContent,
    CodeContent,
    ListContent,
    QuoteContent,
} from "@/lib/freewritecms";

// Re-export Block for convenience
export type { Block } from "@/lib/freewritecms";

interface FreeWriteCmsBlockRendererProps {
    blocks: Block[];
    className?: string;
}

export function FreeWriteCmsBlockRenderer({
    blocks,
    className,
}: FreeWriteCmsBlockRendererProps) {
    if (!blocks || blocks.length === 0) {
        return (
            <div className="text-muted-foreground text-center py-8">
                No content yet
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {blocks.map((block) => (
                <BlockDisplay key={block.id} block={block} />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Individual block renderers
// ---------------------------------------------------------------------------

function BlockDisplay({ block }: { block: Block }) {
    switch (block.type) {
        case "paragraph":
            return (
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {"text" in block.content ? block.content.text : ""}
                </p>
            );

        case "heading": {
            const content = block.content as HeadingContent;
            if (!content.text) return null;
            const HeadingTag = `h${content.level}` as
                | "h1"
                | "h2"
                | "h3"
                | "h4"
                | "h5"
                | "h6";
            const headingClasses: Record<number, string> = {
                1: "text-4xl font-bold",
                2: "text-3xl font-bold",
                3: "text-2xl font-semibold",
                4: "text-xl font-semibold",
                5: "text-lg font-medium",
                6: "text-base font-medium",
            };
            return React.createElement(
                HeadingTag,
                { className: headingClasses[content.level] },
                content.text
            );
        }

        case "image": {
            const content = block.content as ImageContent;
            if (!content.url) return null;
            return (
                <figure className="my-6">
                    <img
                        src={content.url}
                        alt={content.alt || ""}
                        width={content.width}
                        height={content.height}
                        className="rounded-lg max-w-full h-auto"
                    />
                    {content.caption && (
                        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                            {content.caption}
                        </figcaption>
                    )}
                </figure>
            );
        }

        case "code": {
            const content = block.content as CodeContent;
            if (!content.code) return null;
            return (
                <div className="my-4">
                    <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm font-mono">{content.code}</code>
                    </pre>
                    {content.language && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {content.language}
                        </div>
                    )}
                </div>
            );
        }

        case "list": {
            const content = block.content as ListContent;
            if (!content.items) return null;
            const ListTag = content.type === "ordered" ? "ol" : "ul";
            return (
                <ListTag
                    className={cn(
                        "ml-6 space-y-1",
                        content.type === "ordered" ? "list-decimal" : "list-disc"
                    )}
                >
                    {content.items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ListTag>
            );
        }

        case "quote": {
            const content = block.content as QuoteContent;
            if (!content.text) return null;
            return (
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                    {content.text}
                    {content.author && (
                        <footer className="text-sm mt-2 not-italic">
                            — {content.author}
                        </footer>
                    )}
                </blockquote>
            );
        }

        case "divider":
            return <hr className="my-8 border-border" />;

        default:
            return null;
    }
}
