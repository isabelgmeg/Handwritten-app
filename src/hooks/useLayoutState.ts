/**
 * Hook for managing layout state
 */

import { useState } from "react";

export function useLayoutState() {
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 1024);
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth >= 1024);

  return {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
  };
}
