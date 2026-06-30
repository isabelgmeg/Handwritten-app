import { useState, useCallback, useEffect } from "react";

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(pointer: coarse)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

export function useLayoutState() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const isTouch = useIsTouchDevice();

  const toggleLeft = useCallback(() => {
    setLeftOpen(v => {
      if (!v && isTouch) setRightOpen(false);
      return !v;
    });
  }, [isTouch]);

  const toggleRight = useCallback(() => {
    setRightOpen(v => {
      if (!v && isTouch) setLeftOpen(false);
      return !v;
    });
  }, [isTouch]);

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
    isTouch,
  };
}
