import { useState, useMemo } from "react";
import {
  ChevronRight,
  GripVertical,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Module, Progress, Segment } from "~/db/schema";
import { cn } from "~/lib/utils";
import { EditModuleDialog } from "./edit-module-dialog";
import { renderIcon } from "~/components/icon-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { deleteModuleFn } from "./delete-module-button";
import { useSegment } from "./segment-context";

interface ModuleWithSegments extends Module {
  segments: Segment[];
}

interface ModuleAccordionHeaderProps {
  module: ModuleWithSegments;
  progress: Progress[];
  isExpanded: boolean;
  onToggle: () => void;
  dragHandleProps?: any;
  isAdmin: boolean;
  moduleIndex: number;
}

export function ModuleAccordionHeader({
  module,
  progress,
  isExpanded,
  onToggle,
  dragHandleProps,
  isAdmin,
  moduleIndex,
}: ModuleAccordionHeaderProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { locallyCompletedSegmentIds, locallyUncompletedSegmentIds } =
    useSegment();

  // Early return if module data is incomplete
  if (!module || !module.title) {
    return null;
  }

  const isSegmentCompleted = (segmentId: number) => {
    // Check local uncompleted state first (takes precedence)
    if (locallyUncompletedSegmentIds.has(segmentId)) {
      return false;
    }
    // Check both server progress and locally completed segments (for immediate UI feedback)
    return (
      progress.some((p) => p.segmentId === segmentId) ||
      locallyCompletedSegmentIds.has(segmentId)
    );
  };

  const moduleProgress = useMemo(() => {
    // Add safety check for module.segments
    if (!module.segments || !Array.isArray(module.segments)) {
      return {
        completed: 0,
        total: 0,
        percentage: 0,
      };
    }

    const completedSegments = module.segments.filter((segment) =>
      isSegmentCompleted(segment.id)
    ).length;
    return {
      completed: completedSegments,
      total: module.segments.length,
      percentage:
        module.segments.length > 0
          ? (completedSegments / module.segments.length) * 100
          : 0,
    };
  }, [module.segments, progress, locallyCompletedSegmentIds, locallyUncompletedSegmentIds]);

  const handleDeleteModule = async () => {
    try {
      await deleteModuleFn({ data: { moduleId: module.id } });

      toast.success("Module deleted successfully!", {
        description: `"${module.title}" has been permanently deleted.`,
      });

      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete module", {
        description: "Please try again.",
      });
    }
  };

  return (
    <div className="group">
      <div className="relative">
        <button
          aria-label={`Toggle module ${module.title}`}
          onClick={onToggle}
          className={cn(
            "cursor-pointer w-full flex items-center justify-between px-6 py-3 text-sm transition",
            isExpanded
              ? "nav-active"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {dragHandleProps && isAdmin && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </div>
            )}
            {renderIcon(module.icon, { className: "w-4 h-4 flex-shrink-0" })}
            <span className="font-medium truncate">{module.title}</span>
            {moduleProgress.total > 0 && (
              <span className="mono text-[10px] bg-slate-200/60 dark:bg-white/5 px-2.5 py-0.5 rounded-full text-slate-500 border border-slate-300/60 dark:border-white/5 flex-shrink-0">
                {moduleProgress.completed}/{moduleProgress.total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight
              className={cn(
                "h-4 w-4 text-slate-400 dark:text-slate-500 transition-all duration-300",
                isExpanded && "rotate-90 text-cyan-600 dark:text-cyan-400"
              )}
            />
          </div>
        </button>
        {isAdmin && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <EditModuleDialog
        moduleId={module.id}
        moduleTitle={module.title}
        moduleIcon={module.icon}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          animation="slide-left"
          className="bg-background border border-border shadow-elevation-3 rounded-xl max-w-md mx-auto"
        >
          <AlertDialogHeader className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold text-foreground leading-tight">
                Delete Module
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Are you sure you want to delete the module{" "}
              <strong>"{module.title}"</strong>? This action cannot be undone
              and will permanently delete the module and all its associated
              segments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 p-6 pt-0">
            <AlertDialogCancel
              className={buttonVariants({ variant: "gray-outline" })}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModule}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
