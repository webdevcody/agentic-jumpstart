import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Video, Calendar, Crown, Clock } from "lucide-react";
import type { SegmentWithModule } from "~/data-access/segments";

interface SegmentSelectorProps {
  segments: SegmentWithModule[] | undefined;
  isLoading: boolean;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

function SegmentSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/30">
      <div className="h-5 w-5 bg-muted/50 rounded animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
      </div>
    </div>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

export function SegmentSelector({
  segments,
  isLoading,
  selectedIds,
  onSelectionChange,
}: SegmentSelectorProps) {
  // Segments are already sorted by updatedAt from the server
  const totalSegments = segments?.length ?? 0;
  const selectedCount = selectedIds.length;

  const handleToggle = (segmentId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, segmentId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== segmentId));
    }
  };

  const handleSelectAll = () => {
    if (segments) {
      onSelectionChange(segments.map((s) => s.id));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="module-card">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Video className="h-6 w-6 text-theme-500" />
          Select Segments
        </h2>
        <p className="text-muted-foreground">
          Choose which segments to include in the notification email
        </p>
      </div>

      {/* Selection Controls */}
      <div className="px-6 py-4 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading || totalSegments === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isLoading || selectedCount === 0}
            >
              Clear All
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span>{" "}
            of {totalSegments} selected
          </div>
        </div>
      </div>

      {/* Segment List */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <SegmentSkeleton key={idx} />
            ))}
          </div>
        ) : segments && segments.length > 0 ? (
          <div className="space-y-2">
            {segments.map((segment) => (
              <label
                key={segment.id}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer ${
                  selectedIds.includes(segment.id)
                    ? "border-theme-500/50 bg-theme-500/5"
                    : "border-border/50 bg-card/30 hover:bg-card/50 hover:border-border"
                }`}
              >
                <Checkbox
                  checked={selectedIds.includes(segment.id)}
                  onCheckedChange={(checked) =>
                    handleToggle(segment.id, !!checked)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {segment.title}
                    </span>
                    {segment.isPremium && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {segment.isComingSoon && (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="text-xs text-muted-foreground/70">
                      {segment.moduleTitle}
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatRelativeDate(new Date(segment.updatedAt))}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <Video className="h-16 w-16 mx-auto mb-6 opacity-30" />
            <p className="text-lg">No recent segments found</p>
            <p className="text-sm">
              Segments updated in the last 30 days will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
