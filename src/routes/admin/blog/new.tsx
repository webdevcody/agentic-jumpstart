import { createFileRoute, Link } from "@tanstack/react-router";
import { BlogPostForm } from "./-components/blog-post-form";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Page } from "../-components/page";
import { PageHeader } from "../-components/page-header";

export const Route = createFileRoute("/admin/blog/new")({
  component: NewBlogPost,
});

function NewBlogPost() {
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
            <BreadcrumbPage>Create Post</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Create Blog Post"
        highlightedWord="Create"
        description="Write a new blog post for your website"
      />
      
      <BlogPostForm />
    </Page>
  );
}
