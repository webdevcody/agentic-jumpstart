import type { Module, Progress, Segment } from "~/db/schema";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { SegmentItem } from "./segment-item";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { useSegment } from "./segment-context";

interface ModuleWithSegments extends Module {
  segments: Segment[];
}

interface ModulePanelProps {
  module: ModuleWithSegments;
  isExpanded: boolean;
  currentSegmentId: number;
  progress: Progress[];
  isAdmin: boolean;
  isPremium: boolean;
  isLoggedIn?: boolean;
  onSegmentClick: (segmentId: number) => void;
  onDragEnd: (result: any, moduleId: number) => void;
}

export function ModulePanel({
  module,
  isExpanded,
  currentSegmentId,
  progress,
  isAdmin,
  isPremium,
  isLoggedIn,
  onSegmentClick,
  onDragEnd,
}: ModulePanelProps) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { locallyCompletedSegmentIds, locallyUncompletedSegmentIds } =
    useSegment();

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

  const handleCreateSegment = () => {
    navigate({
      to: "/learn/add",
      search: { moduleTitle: module.title },
    });
  };

  // Calculate height immediately when isExpanded changes
  const getContentHeight = () => {
    if (!isExpanded) return 0;
    if (contentRef.current) {
      return contentRef.current.scrollHeight;
    }
    return "auto";
  };

  // Add safety check for module.segments
  const segments = module.segments || [];

  return (
    <div
      className="overflow-hidden transition-all duration-200 ease-out w-full"
      style={{ height: getContentHeight() }}
    >
      <div ref={contentRef}>
        {isAdmin ? (
          <DragDropContext onDragEnd={(result) => onDragEnd(result, module.id)}>
            <Droppable droppableId={`module-${module.id}-segments`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="py-1 space-y-0.5"
                >
                  {segments.map((segment, index) => {
                    const isActive = segment.id === currentSegmentId;
                    const isCompleted = isSegmentCompleted(segment.id);
                    return (
                      <Draggable
                        key={segment.id}
                        draggableId={`segment-${segment.id}`}
                        index={index}
                        isDragDisabled={false}
                      >
                        {(provided, snapshot) => (
                          <SegmentItem
                            segment={segment}
                            index={index}
                            isActive={isActive}
                            isCompleted={isCompleted}
                            isPremium={isPremium}
                            isAdmin={isAdmin}
                            isLoggedIn={isLoggedIn}
                            onSegmentClick={onSegmentClick}
                            provided={provided}
                            snapshot={snapshot}
                          />
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {/* Add new segment button */}
                  <button
                    onClick={handleCreateSegment}
                    className="cursor-pointer w-full flex items-center gap-3 px-6 py-2.5 text-sm text-slate-500 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/5 transition group/add"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-slate-200/60 dark:bg-white/5 group-hover/add:bg-cyan-500/20 transition">
                      <Plus className="h-3 w-3" />
                    </div>
                    <span>New segment</span>
                  </button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="py-1 space-y-0.5">
            {segments.map((segment, index) => {
              const isActive = segment.id === currentSegmentId;
              const isCompleted = isSegmentCompleted(segment.id);
              return (
                <SegmentItem
                  key={segment.id}
                  segment={segment}
                  index={index}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  isPremium={isPremium}
                  isAdmin={isAdmin}
                  isLoggedIn={isLoggedIn}
                  onSegmentClick={onSegmentClick}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
