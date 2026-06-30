import { useState, useCallback, useEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function useLayoutState() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleLeft = useCallback(() => {
    setLeftOpen(v => {
      if (!v && isMobile) setRightOpen(false);
      return !v;
    });
  }, [isMobile]);

  const toggleRight = useCallback(() => {
    setRightOpen(v => {
      if (!v && isMobile) setLeftOpen(false);
      return !v;
    });
  }, [isMobile]);

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
    isMobile,
  };
}
