import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBlogPostByIdFn } from "~/fn/blog";
import { queryOptions } from "@tanstack/react-query";
import { PageHeader } from "../../-components/page-header";
import { BlogPostForm } from "../-components/blog-post-form";
import { NotFound } from "~/components/NotFound";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Page } from "../../-components/page";

export const Route = createFileRoute("/admin/blog/$id/edit")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      blogPostQuery(parseInt(params.id))
    );
  },
  component: EditBlogPost,
});

const blogPostQuery = (id: number) =>
  queryOptions({
    queryKey: ["admin", "blog-post", id],
    queryFn: async () => {
      return getBlogPostByIdFn({ data: { id } });
    },
  });

function EditBlogPost() {
  const { id } = Route.useParams();
  const { data: blogPost, isLoading } = useQuery(blogPostQuery(parseInt(id)));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
        <div className="h-96 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (!blogPost) {
    return <NotFound />;
  }

  return (
    <Page>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/blog">Blog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Post</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Edit Blog Post"
        highlightedWord="Edit"
        description="Update your blog post content and settings"
      />
      
      <BlogPostForm blogPost={blogPost} />
    </Page>
  );
}