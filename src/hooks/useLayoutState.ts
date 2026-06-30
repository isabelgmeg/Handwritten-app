/**
 * Hook for managing layout state
 */

import { useState, useCallback } from "react";

const OVERLAY_BREAKPOINT = 1024;

export function useLayoutState() {
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= OVERLAY_BREAKPOINT);
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth >= OVERLAY_BREAKPOINT);

  const toggleLeft = useCallback(() => {
    setLeftOpen(v => {
      const opening = !v;
      if (opening && window.innerWidth < OVERLAY_BREAKPOINT) setRightOpen(false);
      return opening;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen(v => {
      const opening = !v;
      if (opening && window.innerWidth < OVERLAY_BREAKPOINT) setLeftOpen(false);
      return opening;
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
