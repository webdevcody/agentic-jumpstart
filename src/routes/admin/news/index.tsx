import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assertIsAdminFn } from "~/fn/auth";
import {
  getNewsEntriesWithTagsFn,
  deleteNewsEntryFn,
  getAllNewsTagsFn,
} from "~/fn/news";
import { PageHeader } from "../-components/page-header";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Video,
  FileText,
  Newspaper,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Page } from "../-components/page";

export const Route = createFileRoute("/admin/news/")({
  beforeLoad: () => assertIsAdminFn(),
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const queryClient = useQueryClient();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const { data: newsEntries, isLoading } = useQuery({
    queryKey: ["admin", "news-entries"],
    queryFn: () => getNewsEntriesWithTagsFn(),
  });

  const { data: availableTags } = useQuery({
    queryKey: ["news-tags"],
    queryFn: () => getAllNewsTagsFn(),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: number) => deleteNewsEntryFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "news-entries"] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "blog":
        return <FileText className="h-4 w-4" />;
      case "changelog":
        return <Newspaper className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "blog":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "changelog":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Page>
        <PageHeader
          title="News Management"
          highlightedWord="News"
          description="Manage AI news entries, YouTube videos, and blog posts"
        />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="News Management"
        highlightedWord="News"
        description="Manage AI news entries, YouTube videos, and blog posts"
        actions={
          <div className="flex items-end gap-2 self-end">
            <Button asChild className="self-end">
              <Link to="/admin/news/new">
                <Plus className="h-4 w-4 mr-2" />
                Add News Entry
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{newsEntries?.length || 0} entries</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {newsEntries?.map((entry) => (
          <Card
            key={entry.id}
            className="group hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={getTypeColor(entry.type)}
                    >
                      {getTypeIcon(entry.type)}
                      <span className="ml-1 capitalize">{entry.type}</span>
                    </Badge>

                    {!entry.isPublished && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}

                    {entry.isPublished && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 dark:text-green-400"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg mb-1">{entry.title}</CardTitle>

                  {entry.description && (
                    <CardDescription className="line-clamp-2">
                      {entry.description}
                    </CardDescription>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/news/${entry.id}/edit` as any}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent animation="slide-right">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete News Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{entry.title}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                          variant="destructive"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Published {formatDate(entry.publishedAt)}</span>
                  </div>

                  {entry.authorName && <span>by {entry.authorName}</span>}
                </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {entry.tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {newsEntries?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No news entries yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first AI news entry, YouTube video,
                or blog post.
              </p>
              <Button asChild>
                <Link to="/admin/news/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Entry
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}
