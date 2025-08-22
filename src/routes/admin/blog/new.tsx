import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../-components/page-header";
import { BlogPostForm } from "./-components/blog-post-form";

export const Route = createFileRoute("/admin/blog/new")({
  component: NewBlogPost,
});

function NewBlogPost() {
  return (
    <>
      <PageHeader
        title="Create Blog Post"
        highlightedWord="Create"
        description="Write a new blog post for your website"
      />
      
      <BlogPostForm />
    </>
  );
}