import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  getAllLaunchKitsFn,
  getLaunchKitStatsFn,
  createLaunchKitFn,
  updateLaunchKitFn,
  deleteLaunchKitFn,
  getAllTagsFn,
  createTagFn
} from "~/fn/launch-kits";
import { assertIsAdminFn } from "~/fn/auth";
import { PageHeader } from "./-components/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Eye, 
  GitFork,
  MessageSquare,
  Tag,
  BarChart3
} from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/launch-kits")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(launchKitsQuery);
    context.queryClient.ensureQueryData(statsQuery);
    context.queryClient.ensureQueryData(tagsQuery);
  },
  component: AdminLaunchKits,
});

const launchKitsQuery = queryOptions({
  queryKey: ["admin", "launch-kits"],
  queryFn: () => getAllLaunchKitsFn({ data: {} }),
});

const statsQuery = queryOptions({
  queryKey: ["admin", "launch-kit-stats"],
  queryFn: () => getLaunchKitStatsFn(),
});

const tagsQuery = queryOptions({
  queryKey: ["launch-kit-tags"],
  queryFn: () => getAllTagsFn(),
});

function AdminLaunchKits() {
  const { data: launchKits, isLoading: kitsLoading } = useQuery(launchKitsQuery);
  const { data: stats, isLoading: statsLoading } = useQuery(statsQuery);
  const { data: tags } = useQuery(tagsQuery);
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: createLaunchKitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kits"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kit-stats"] });
      setIsCreateOpen(false);
      toast.success("Launch kit created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create launch kit");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLaunchKitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kits"] });
      setEditingKit(null);
      toast.success("Launch kit updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update launch kit");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLaunchKitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kits"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kit-stats"] });
      toast.success("Launch kit deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete launch kit");
    },
  });

  const createTagMutation = useMutation({
    mutationFn: createTagFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launch-kit-tags"] });
      setIsTagCreateOpen(false);
      toast.success("Tag created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tag");
    },
  });

  return (
    <>
      <PageHeader
        title="Launch Kits Management"
        highlightedWord="Management"
        description="Manage launch kits, tags, and monitor analytics for starter repositories"
      />

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kits</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalKits || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clones</CardTitle>
            <GitFork className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalClones || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalComments || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Launch Kit
            </Button>
          </DialogTrigger>
          <LaunchKitForm
            onSubmit={(data) => createMutation.mutate({ data })}
            isLoading={createMutation.isPending}
            tags={tags || []}
          />
        </Dialog>

        <Dialog open={isTagCreateOpen} onOpenChange={setIsTagCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Tag className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <TagForm
            onSubmit={(data) => createTagMutation.mutate({ data })}
            isLoading={createTagMutation.isPending}
          />
        </Dialog>
      </div>

      {/* Launch Kits List */}
      <div className="space-y-4">
        {kitsLoading ? (
          <div className="text-center py-8">Loading launch kits...</div>
        ) : launchKits?.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Launch Kits Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first launch kit.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Launch Kit
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          launchKits?.map((kit: any) => (
            <Card key={kit.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {kit.name}
                      <Badge variant={kit.difficulty === 'beginner' ? 'default' : kit.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                        {kit.difficulty}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{kit.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKit(kit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(kit.repositoryUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ data: { id: kit.id } })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {kit.cloneCount} clones
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {kit.slug}
                  </span>
                  <span>By {kit.authorName}</span>
                  <span>{new Date(kit.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingKit && (
        <Dialog open={!!editingKit} onOpenChange={() => setEditingKit(null)}>
          <LaunchKitForm
            kit={editingKit}
            onSubmit={(data) => updateMutation.mutate({ 
              data: { id: editingKit.id, updates: data } 
            })}
            isLoading={updateMutation.isPending}
            tags={tags || []}
          />
        </Dialog>
      )}
    </>
  );
}

function LaunchKitForm({ kit, onSubmit, isLoading, tags }: any) {
  const [formData, setFormData] = useState({
    name: kit?.name || "",
    description: kit?.description || "",
    longDescription: kit?.longDescription || "",
    repositoryUrl: kit?.repositoryUrl || "",
    demoUrl: kit?.demoUrl || "",
    imageUrl: kit?.imageUrl || "",
    difficulty: kit?.difficulty || "beginner",
    tagIds: kit?.tags?.map((t: any) => t.id) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{kit ? 'Edit' : 'Create'} Launch Kit</DialogTitle>
        <DialogDescription>
          {kit ? 'Update the launch kit details' : 'Create a new launch kit for users to explore'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="longDescription">Long Description</Label>
          <Textarea
            id="longDescription"
            value={formData.longDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
            rows={5}
          />
        </div>

        <div>
          <Label htmlFor="repositoryUrl">Repository URL *</Label>
          <Input
            id="repositoryUrl"
            type="url"
            value={formData.repositoryUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, repositoryUrl: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="demoUrl">Demo URL</Label>
          <Input
            id="demoUrl"
            type="url"
            value={formData.demoUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <DialogTrigger asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogTrigger>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : kit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function TagForm({ onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    category: "framework" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Tag</DialogTitle>
        <DialogDescription>
          Create a new tag to categorize launch kits
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="tag-name">Name *</Label>
          <Input
            id="tag-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="tag-color">Color</Label>
          <Input
            id="tag-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="tag-category">Category</Label>
          <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="framework">Framework</SelectItem>
              <SelectItem value="language">Language</SelectItem>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="deployment">Deployment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <DialogTrigger asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogTrigger>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}