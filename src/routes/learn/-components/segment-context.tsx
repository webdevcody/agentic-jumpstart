import { createContext, useContext, useState, useCallback } from "react";

interface SegmentContextType {
  currentSegmentId: number | null;
  setCurrentSegmentId: (id: number) => void;
  locallyCompletedSegmentIds: Set<number>;
  locallyUncompletedSegmentIds: Set<number>;
  markSegmentAsLocallyCompleted: (segmentId: number) => void;
  unmarkSegmentAsLocallyCompleted: (segmentId: number) => void;
}

const SegmentContext = createContext<SegmentContextType | undefined>(undefined);

export function SegmentProvider({ children }: { children: React.ReactNode }) {
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [locallyCompletedSegmentIds, setLocallyCompletedSegmentIds] = useState<Set<number>>(new Set());
  const [locallyUncompletedSegmentIds, setLocallyUncompletedSegmentIds] = useState<Set<number>>(
    new Set()
  );

  const markSegmentAsLocallyCompleted = useCallback((segmentId: number) => {
    setLocallyCompletedSegmentIds((prev) => new Set([...prev, segmentId]));
    setLocallyUncompletedSegmentIds((prev) => {
      if (!prev.has(segmentId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
  }, []);

  const unmarkSegmentAsLocallyCompleted = useCallback((segmentId: number) => {
    setLocallyCompletedSegmentIds((prev) => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
    setLocallyUncompletedSegmentIds((prev) => new Set([...prev, segmentId]));
  }, []);

  return (
    <SegmentContext.Provider
      value={{
        currentSegmentId,
        setCurrentSegmentId,
        locallyCompletedSegmentIds,
        locallyUncompletedSegmentIds,
        markSegmentAsLocallyCompleted,
        unmarkSegmentAsLocallyCompleted,
      }}
    >
      {children}
    </SegmentContext.Provider>
  );
}

export function useSegment() {
  const context = useContext(SegmentContext);
  if (context === undefined) {
    throw new Error("useSegment must be used within a SegmentProvider");
  }
  return context;
}
