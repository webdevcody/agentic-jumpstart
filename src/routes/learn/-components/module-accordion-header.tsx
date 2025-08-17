import { useState, useMemo } from "react";
import {
  Check,
  ChevronRight,
  CircleCheck,
  GripVertical,
  BookOpen,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Module, Progress, Segment } from "~/db/schema";
import { cn } from "~/lib/utils";
import { EditModuleDialog } from "./edit-module-dialog";
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
import { useToast } from "~/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { deleteModuleFn } from "./delete-module-button";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Early return if module data is incomplete
  if (!module || !module.title) {
    return null;
  }

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
      progress.some((p) => p.segmentId === segment.id)
    ).length;
    return {
      completed: completedSegments,
      total: module.segments.length,
      percentage:
        module.segments.length > 0
          ? (completedSegments / module.segments.length) * 100
          : 0,
    };
  }, [module.segments, progress]);

  const handleDeleteModule = async () => {
    try {
      await deleteModuleFn({ data: { moduleId: module.id } });

      toast({
        title: "Module deleted successfully!",
        description: `"${module.title}" has been permanently deleted.`,
      });

      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to delete module",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="group animate-fade-in"
      style={{ animationDelay: `${moduleIndex * 150}ms` }}
    >
      <div className="w-full">
        <div className="relative p-4 w-full">
          <div className="flex items-center gap-3">
            {dragHandleProps && isAdmin && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-theme-100 dark:hover:bg-theme-800 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={onToggle}
                className="flex items-center justify-between flex-1 text-left group/module"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-theme-500/10 to-theme-600/10 group-hover/module:from-theme-500/20 group-hover/module:to-theme-600/20 transition-all duration-300 flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground group-hover/module:text-theme-600 dark:group-hover/module:text-theme-400 transition-colors duration-200 line-clamp-2">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {moduleProgress.percentage === 100 ? (
                        <div className="flex items-center gap-1 text-theme-600 dark:text-theme-400">
                          <CircleCheck className="h-3 w-3" />
                          <span className="text-xs font-medium">Complete</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {moduleProgress.completed} of {moduleProgress.total}{" "}
                          completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isAdmin && (
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200 dark:text-gray-700"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          className="text-theme-500"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${moduleProgress.percentage}, 100`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {moduleProgress.percentage === 100 ? (
                          <Check className="h-3 w-3 text-theme-600 dark:text-theme-400" />
                        ) : (
                          <span className="text-xs font-semibold text-theme-600 dark:text-theme-400"></span>
                        )}
                      </div>
                    </div>
                  )}

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-all duration-300 group-hover/module:text-theme-600 dark:group-hover/module:text-theme-400",
                      isExpanded && "rotate-90"
                    )}
                  />
                </div>
              </button>
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
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
              )}
            </div>
          </div>
        </div>
      </div>
      
      <EditModuleDialog
        moduleId={module.id}
        moduleTitle={module.title}
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
              <strong>"{module.title}"</strong>? This action cannot be undone and
              will permanently delete the module and all its associated segments.
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
