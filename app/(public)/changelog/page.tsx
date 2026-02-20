import { fetchFreewriteCMS, type Block } from "@/lib/freewritecms";
import { FreeWriteCmsBlockRenderer } from "@/components/freewritecms-block-renderer";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// GraphQL query — customize per project
// ---------------------------------------------------------------------------

const CHANGELOGS_QUERY = `
  query GetChangelogs {
    changelogs {
      edges {
        node {
          id
          title
          slug
          content
          publishedAt
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types for this page's data shape
// ---------------------------------------------------------------------------

interface ChangelogNode {
    id: string;
    title: string;
    slug: string;
    content: Block[];
    publishedAt: string;
}

interface ChangelogsData {
    changelogs: {
        edges: Array<{ node: ChangelogNode }>;
    };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function Page() {
    const { data } = await fetchFreewriteCMS<ChangelogsData>({
        query: CHANGELOGS_QUERY,
        revalidate: 60,
    });

    const changelogs = data?.changelogs?.edges || [];

    return (
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-24 space-y-12">
            <div className="space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Changelog
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        powered by{" "}
                        <a
                            href="https://freewritecms.com"
                            target="_blank"
                            className="underline hover:text-primary"
                        >
                            Freewrite CMS
                        </a>
                    </p>
                </div>

                <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
                    Stay updated with our latest features and improvements.
                </p>
            </div>

            <div className="space-y-8">
                {changelogs.length > 0 ? (
                    changelogs.map((edge, index) => {
                        const { id, title, publishedAt, content } = edge.node;
                        return (
                            <div
                                key={id}
                                className="border rounded-xl p-6 shadow-sm bg-card hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="mb-4 space-y-2 border-b pb-4">
                                    <h3 className="text-2xl font-bold tracking-tight">
                                        <span className="text-muted-foreground mr-2">
                                            #{changelogs.length - index}
                                        </span>
                                        {title}
                                    </h3>
                                    <time
                                        className="block text-sm text-muted-foreground"
                                        dateTime={publishedAt}
                                    >
                                        {format(new Date(publishedAt), "MMMM d, yyyy")}
                                    </time>
                                </div>

                                <FreeWriteCmsBlockRenderer blocks={content} />
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        No changelogs found.
                    </div>
                )}
            </div>
        </div>
    );
}