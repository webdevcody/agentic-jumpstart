import { useState, useEffect } from "react";
import { FileText, MessageSquare, BookOpen } from "lucide-react";
import { cn } from "~/lib/utils";
import { type Segment } from "~/db/schema";
import { ContentPanel } from "./content-panel";
import { CommentsPanel } from "./comments-panel";
import { MarkdownContent } from "~/routes/learn/-components/markdown-content";
import { GlassPanel } from "~/components/ui/glass-panel";

type TabType = "summary" | "content" | "transcripts" | "comments";

interface VideoContentTabsPanelProps {
  currentSegment: Segment;
  isLoggedIn: boolean;
  defaultTab?: TabType;
  commentId?: number;
  isAdmin?: boolean;
  showContentTabs: boolean;
}

export function VideoContentTabsPanel({
  currentSegment,
  isLoggedIn,
  defaultTab,
  commentId,
  isAdmin,
  showContentTabs,
}: VideoContentTabsPanelProps) {
  // Default to summary tab, fall back to comments if content tabs are disabled and trying to access content
  const effectiveDefaultTab =
    !showContentTabs && defaultTab === "content"
      ? "summary"
      : defaultTab || "summary";

  const [activeTab, setActiveTab] = useState<TabType>(effectiveDefaultTab);

  // Set active tab when defaultTab changes (from URL params)
  useEffect(() => {
    if (defaultTab) {
      // If content tabs are disabled and trying to set content, use summary instead
      if (!showContentTabs && defaultTab === "content") {
        setActiveTab("summary");
      } else {
        setActiveTab(defaultTab);
      }
    }
  }, [defaultTab, showContentTabs]);

  return (
    <GlassPanel variant="cyan">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200/60 dark:border-white/10">
        <button
          onClick={() => setActiveTab("summary")}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer",
            activeTab === "summary"
              ? "border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Summary
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer",
            activeTab === "comments"
              ? "border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Discussion
        </button>
        {showContentTabs && (
          <button
            onClick={() => setActiveTab("content")}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer",
              activeTab === "content"
                ? "border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            )}
          >
            <FileText className="h-4 w-4" />
            Lesson Content
          </button>
        )}
        <button
          onClick={() => setActiveTab("transcripts")}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer",
            activeTab === "transcripts"
              ? "border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          <FileText className="h-4 w-4" />
          Transcripts
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 min-h-96">
        {activeTab === "summary" && (
          <div className="animate-fade-in">
            {currentSegment.summary ? (
              <MarkdownContent content={currentSegment.summary} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No summary available for this segment.</p>
              </div>
            )}
          </div>
        )}

        {showContentTabs && activeTab === "content" && (
          <ContentPanel currentSegment={currentSegment} isAdmin={isAdmin} />
        )}

        {activeTab === "transcripts" && (
          <div className="animate-fade-in">
            {currentSegment.transcripts ? (
              <MarkdownContent content={currentSegment.transcripts} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcripts available for this segment.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <CommentsPanel
            currentSegmentId={currentSegment.id}
            isLoggedIn={isLoggedIn}
            activeTab={activeTab}
            commentId={commentId}
          />
        )}
      </div>
    </GlassPanel>
  );
}
