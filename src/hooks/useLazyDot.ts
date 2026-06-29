/**
 * Hook for managing lazy brush dot indicator
 */

import { useState } from "react";

export function useLazyDot() {
  const [showDot, setShowDot] = useState(false);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });

  return {
    showDot,
    setShowDot,
    dotPos,
    setDotPos,
  };
}
