import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Database,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import {
  getVectorizationStatusFn,
  vectorizeAllSegmentsFn,
  vectorizeSegmentFn,
} from "~/fn/vector-search";
import { toast } from "sonner";
import { queryOptions } from "@tanstack/react-query";
import { assertIsAdminFn } from "~/fn/auth";

export const Route = createFileRoute("/admin/vectorization")({
  beforeLoad: () => assertIsAdminFn(),
  component: AdminVectorization,
});

const vectorizationQuery = queryOptions({
  queryKey: ["admin", "vectorization", "status"],
  queryFn: () => getVectorizationStatusFn(),
});

type SegmentStatus = Awaited<
  ReturnType<typeof getVectorizationStatusFn>
>["segments"][number];

function AdminVectorization() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(vectorizationQuery);
  const [processingSegments, setProcessingSegments] = useState<Set<number>>(
    new Set()
  );

  const vectorizeAllMutation = useMutation({
    mutationFn: vectorizeAllSegmentsFn,
    onSuccess: (result) => {
      toast.success(
        `Vectorized ${result.processed} segment${result.processed !== 1 ? "s" : ""}${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ""}`
      );
      queryClient.invalidateQueries({
        queryKey: ["admin", "vectorization"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to vectorize segments"
      );
    },
  });

  const vectorizeSegmentMutation = useMutation({
    mutationFn: vectorizeSegmentFn,
    onSuccess: (result) => {
      toast.success(`Created ${result.chunksCreated} chunks for segment`);
      queryClient.invalidateQueries({
        queryKey: ["admin", "vectorization"],
      });
      setProcessingSegments((prev) => {
        const next = new Set(prev);
        next.delete(result.segmentId);
        return next;
      });
    },
    onError: (error, variables) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to vectorize segment"
      );
      setProcessingSegments((prev) => {
        const next = new Set(prev);
        next.delete(variables.data.segmentId);
        return next;
      });
    },
  });

  const handleVectorizeAll = () => {
    vectorizeAllMutation.mutate({ data: {} });
  };

  const handleVectorizeSegment = (segmentId: number) => {
    setProcessingSegments((prev) => new Set(prev).add(segmentId));
    vectorizeSegmentMutation.mutate({ data: { segmentId } });
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page>
        <div className="text-center text-muted-foreground">
          Failed to load vectorization status
        </div>
      </Page>
    );
  }

  const { segments, modules, stats } = data;

  // Group segments by module
  const segmentsByModule = new Map<
    number,
    { module: (typeof modules)[number]; segments: SegmentStatus[] }
  >();

  modules.forEach((module) => {
    segmentsByModule.set(module.id, {
      module,
      segments: [],
    });
  });

  segments.forEach((segment) => {
    const moduleId = modules.find((m) => m.title === segment.moduleTitle)?.id;
    if (moduleId) {
      const moduleData = segmentsByModule.get(moduleId);
      if (moduleData) {
        moduleData.segments.push(segment);
      }
    }
  });

  return (
    <Page>
      <PageHeader
        title="Transcript Vectorization"
        highlightedWord="Vectorization"
        description="Generate vector embeddings for transcript search. Embeddings enable semantic search across all course content."
        actions={
          <Button
            onClick={handleVectorizeAll}
            disabled={
              vectorizeAllMutation.isPending || stats.needsVectorization === 0
            }
            className="flex items-center gap-2"
          >
            {vectorizeAllMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vectorizing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Vectorize All
              </>
            )}
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withTranscripts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vectorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.vectorized}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Vectorization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.needsVectorization}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Chunks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChunks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Segments List */}
      <div className="space-y-6">
        {Array.from(segmentsByModule.values())
          .filter(({ segments }) => segments.length > 0)
          .sort((a, b) => a.module.order - b.module.order)
          .map(({ module, segments: moduleSegments }) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>
                  {moduleSegments.length} segment
                  {moduleSegments.length !== 1 ? "s" : ""} •{" "}
                  {moduleSegments.filter((s) => s.isVectorized).length}{" "}
                  vectorized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moduleSegments.map((segment) => (
                    <SegmentRow
                      key={segment.id}
                      segment={segment}
                      onVectorize={() => handleVectorizeSegment(segment.id)}
                      isProcessing={processingSegments.has(segment.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </Page>
  );
}

interface SegmentRowProps {
  segment: SegmentStatus;
  onVectorize: () => void;
  isProcessing: boolean;
}

function SegmentRow({ segment, onVectorize, isProcessing }: SegmentRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium">{segment.title}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {segment.hasTranscript ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <FileText className="h-3 w-3" />
              <span>Has Transcript</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>No Transcript</span>
            </div>
          )}

          {segment.isVectorized ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Database className="h-3 w-3" />
              <span>{segment.chunkCount} chunks</span>
            </div>
          ) : segment.hasTranscript ? (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Not Vectorized</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="ml-4">
        {segment.needsVectorization ? (
          <Button
            onClick={onVectorize}
            disabled={isProcessing}
            size="sm"
            variant="outline"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Vectorizing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-2" />
                Vectorize
              </>
            )}
          </Button>
        ) : segment.isVectorized ? (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1">
            No Transcript
          </Badge>
        )}
      </div>
    </div>
  );
}
