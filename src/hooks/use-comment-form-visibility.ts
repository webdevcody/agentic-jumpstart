import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to manage comment form visibility state
 * 
 * Handles the logic for showing/hiding the comment form based on:
 * - Whether there are existing comments
 * - User interactions (starting a discussion)
 * 
 * @param existingComments - Array of existing comments
 * @returns Object with form visibility state and handlers
 */
export function useCommentFormVisibility(existingComments?: unknown[]) {
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Show form when comments exist or when user starts discussion
  useEffect(() => {
    if (existingComments && existingComments.length > 0) {
      setShowCommentForm(true);
    }
  }, [existingComments]);

  // Handler for starting a discussion
  const handleStartDiscussion = useCallback(() => {
    setShowCommentForm(true);
  }, []);

  return {
    showCommentForm,
    handleStartDiscussion,
  };
}