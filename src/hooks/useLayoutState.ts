/**
 * Hook for managing layout state
 */

import { useState, useCallback } from "react";

export function useLayoutState() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const toggleLeft = useCallback(() => {
    setLeftOpen(v => {
      if (!v) setRightOpen(false);
      return !v;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen(v => {
      if (!v) setLeftOpen(false);
      return !v;
    });
  }, []);

  const closeAll = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  return {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    toggleLeft,
    toggleRight,
    closeAll,
  };
}
