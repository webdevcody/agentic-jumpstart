import { useRef, useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { Module, Progress, Segment } from "~/db/schema";
import { cn } from "~/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSegment } from "~/routes/learn/-components/segment-context";

interface ModuleWithSegments extends Module {
  segments?: Segment[];
}

interface QuickNavigationBarProps {
  modules?: ModuleWithSegments[];
  currentSegmentId: number;
  progress?: Progress[];
  isPremium: boolean;
  isAdmin: boolean;
}

// Constants
const SCROLL_AMOUNT = 200;
const MAX_MODULE_TITLE_WIDTH = 140;
const MAX_SEGMENT_TITLE_WIDTH = 200;
const MAX_SCROLLABLE_WIDTH = 400;

// Component: Module Dropdown Item
interface ModuleDropdownItemProps {
  module: ModuleWithSegments;
  isActive: boolean;
  completed: number;
  total: number;
  firstSegmentSlug?: string;
  firstSegmentId?: number;
}

function ModuleDropdownItem({
  module,
  isActive,
  completed,
  total,
  firstSegmentSlug,
  firstSegmentId,
}: ModuleDropdownItemProps) {
  const { setCurrentSegmentId } = useSegment();

  if (!firstSegmentSlug || !firstSegmentId) {
    return (
      <DropdownMenuItem
        disabled
        className={cn(
          "flex items-center justify-between gap-2 cursor-pointer",
          isActive && "bg-emerald-500/10 text-emerald-400"
        )}
      >
        <span className="truncate font-medium">{module.title}</span>
        <span className="text-[10px] text-slate-500 shrink-0">
          {completed}/{total}
        </span>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        to="/learn/$slug"
        params={{ slug: firstSegmentSlug }}
        onClick={() => {
          // Update segment context before navigation to prevent redirect loop
          setCurrentSegmentId(firstSegmentId);
        }}
        className={cn(
          "flex items-center justify-between gap-2 cursor-pointer",
          isActive && "bg-emerald-500/10 text-emerald-400"
        )}
      >
        <span className="truncate font-medium">{module.title}</span>
        <span className="text-[10px] text-slate-500 shrink-0">
          {completed}/{total}
        </span>
      </Link>
    </DropdownMenuItem>
  );
}

// Component: Segment Dropdown Item
interface SegmentDropdownItemProps {
  segment: Segment;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  canAccess: boolean;
  isPremium: boolean;
  isAdmin: boolean;
}

function SegmentDropdownItem({
  segment,
  index,
  isActive,
  isCompleted,
  canAccess,
  isPremium,
  isAdmin,
}: SegmentDropdownItemProps) {
  const { setCurrentSegmentId } = useSegment();

  if (!canAccess) {
    return (
      <DropdownMenuItem
        disabled
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          isActive && "bg-emerald-500/10 text-emerald-400"
        )}
      >
        <span className="text-slate-600 w-5 text-right shrink-0 font-mono text-[10px]">
          {index + 1}.
        </span>
        <span className="truncate flex-1">{segment.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isCompleted && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {segment.isPremium && !isPremium && !isAdmin && (
            <Lock className="w-3 h-3 text-amber-400" />
          )}
          {segment.isComingSoon && (
            <span className="text-[9px] text-slate-500 uppercase">Soon</span>
          )}
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        to="/learn/$slug"
        params={{ slug: segment.slug }}
        onClick={() => {
          // Update segment context before navigation to prevent redirect loop
          setCurrentSegmentId(segment.id);
        }}
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          isActive && "bg-emerald-500/10 text-emerald-400"
        )}
      >
        <span className="text-slate-600 w-5 text-right shrink-0 font-mono text-[10px]">
          {index + 1}.
        </span>
        <span className="truncate flex-1">{segment.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isCompleted && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {segment.isPremium && !isPremium && !isAdmin && (
            <Lock className="w-3 h-3 text-amber-400" />
          )}
          {segment.isComingSoon && (
            <span className="text-[9px] text-slate-500 uppercase">Soon</span>
          )}
        </div>
      </Link>
    </DropdownMenuItem>
  );
}

// Component: Module Pill Button
interface ModulePillButtonProps {
  module: ModuleWithSegments;
  isActive: boolean;
  completed: number;
  total: number;
  progressPercent: number;
  targetSegmentSlug?: string;
  targetSegmentId?: number;
}

function ModulePillButton({
  module,
  isActive,
  completed,
  total,
  progressPercent,
  targetSegmentSlug,
  targetSegmentId,
}: ModulePillButtonProps) {
  const { setCurrentSegmentId } = useSegment();

  if (!targetSegmentSlug || !targetSegmentId) {
    return (
      <button
        disabled
        className={cn(
          "relative px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all overflow-hidden whitespace-nowrap shrink-0",
          isActive
            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-emerald-500/10 transition-all",
            isActive ? "opacity-100" : "opacity-0"
          )}
          style={{ width: `${progressPercent}%` }}
        />
        <span className="relative">{module.title}</span>
      </button>
    );
  }

  return (
    <Link
      to="/learn/$slug"
      params={{ slug: targetSegmentSlug }}
      onClick={() => {
        // Update segment context before navigation to prevent redirect loop
        setCurrentSegmentId(targetSegmentId);
      }}
      className={cn(
        "relative px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all overflow-hidden whitespace-nowrap shrink-0 block",
        isActive
          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-emerald-500/10 transition-all",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{ width: `${progressPercent}%` }}
      />
      <span className="relative">{module.title}</span>
    </Link>
  );
}

export function QuickNavigationBar({
  modules,
  currentSegmentId,
  progress = [],
  isPremium,
  isAdmin,
}: QuickNavigationBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability, modules]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({
        left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: "smooth",
      });
    }
  };

  // Show loading spinner if modules are not yet loaded
  if (!modules) {
    return (
      <div className="relative z-50 flex items-center justify-center gap-2 px-4 py-2 bg-white/60 dark:bg-[#0b101a]/60 border-b border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Loading navigation...</span>
      </div>
    );
  }

  // Return null if no modules available
  if (modules.length === 0) return null;

  // Find current module - safely handle undefined segments
  const currentModule = modules.find((m) =>
    m.segments?.some((s) => s.id === currentSegmentId)
  );
  const currentSegment = currentModule?.segments?.find(
    (s) => s.id === currentSegmentId
  );

  const isSegmentCompleted = (segmentId: number) =>
    progress.some((p) => p.segmentId === segmentId);

  const canAccessSegment = (segment: Segment) =>
    !segment.isComingSoon && (!segment.isPremium || isPremium || isAdmin);

  const getModuleProgress = (module: ModuleWithSegments) => {
    const segments = module.segments || [];
    const completed = segments.filter((s) => isSegmentCompleted(s.id)).length;
    return { completed, total: segments.length };
  };

  return (
    <div className="relative z-50 flex items-center gap-1 px-4 py-2 bg-white/60 dark:bg-[#0b101a]/60 border-b border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
      {/* Module/Category breadcrumb */}
      <div className="flex items-center gap-1">
        {/* Current Module Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span
                className="truncate"
                style={{ maxWidth: `${MAX_MODULE_TITLE_WIDTH}px` }}
              >
                {currentModule?.title || "Select Module"}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-80 overflow-y-auto glass border-slate-200/60 dark:border-white/10"
          >
            {modules.map((module) => {
              const { completed, total } = getModuleProgress(module);
              const isActive = module.id === currentModule?.id;
              const segments = module.segments || [];
              const firstSegmentSlug =
                segments.length > 0 ? segments[0].slug : undefined;
              const firstSegmentId =
                segments.length > 0 ? segments[0].id : undefined;

              return (
                <ModuleDropdownItem
                  key={module.id}
                  module={module}
                  isActive={isActive}
                  completed={completed}
                  total={total}
                  firstSegmentSlug={firstSegmentSlug}
                  firstSegmentId={firstSegmentId}
                />
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        {/* Current Segment Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span
                className="truncate"
                style={{ maxWidth: `${MAX_SEGMENT_TITLE_WIDTH}px` }}
              >
                {currentSegment?.title || "Select Segment"}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-80 max-h-[70vh] overflow-y-auto glass border-slate-200/60 dark:border-white/10"
          >
            {modules.map((module, moduleIndex) => {
              const segments = module.segments || [];
              return (
                <div key={module.id}>
                  {moduleIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {module.title}
                  </DropdownMenuLabel>

                  {segments.map((segment, index) => {
                    const isActive = segment.id === currentSegmentId;
                    const isCompleted = isSegmentCompleted(segment.id);
                    const canAccess = canAccessSegment(segment);

                    return (
                      <SegmentDropdownItem
                        key={segment.id}
                        segment={segment}
                        index={index}
                        isActive={isActive}
                        isCompleted={isCompleted}
                        canAccess={canAccess}
                        isPremium={isPremium}
                        isAdmin={isAdmin}
                      />
                    );
                  })}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick module pills for desktop */}
      <div className="hidden md:flex items-center gap-2">
        {/* Left scroll button */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-all shadow-sm shrink-0",
            !canScrollLeft && "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex items-center gap-1 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            maxWidth: `${MAX_SCROLLABLE_WIDTH}px`,
          }}
        >
          {modules.map((module) => {
            const isActive = module.id === currentModule?.id;
            const { completed, total } = getModuleProgress(module);
            const progressPercent = total > 0 ? (completed / total) * 100 : 0;
            const segments = module.segments || [];

            let targetSegmentSlug: string | undefined;
            let targetSegmentId: number | undefined;
            if (segments.length > 0) {
              const incompleteSegment = segments.find(
                (s) => !isSegmentCompleted(s.id) && canAccessSegment(s)
              );
              const targetSegment = incompleteSegment || segments[0];
              targetSegmentSlug = targetSegment.slug;
              targetSegmentId = targetSegment.id;
            }

            return (
              <ModulePillButton
                key={module.id}
                module={module}
                isActive={isActive}
                completed={completed}
                total={total}
                progressPercent={progressPercent}
                targetSegmentSlug={targetSegmentSlug}
                targetSegmentId={targetSegmentId}
              />
            );
          })}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll("right")}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-all shadow-sm shrink-0",
            !canScrollRight && "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
