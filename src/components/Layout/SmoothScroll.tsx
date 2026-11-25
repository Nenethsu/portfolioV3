import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import "lenis/dist/lenis.css";
import {
  ScrollTrigger,
  scrollToTop,
  startSmoothScroll,
} from "../../lib/motion";

/**
 * Lenis smooth scrolling for the whole app. Render it before <Outlet />: its layout effect
 * then resets the scroll before the new page creates its ScrollTriggers, so they don't
 * fire early because of the old page's scroll position.
 */
const SmoothScroll = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const stop = startSmoothScroll();
    // Images and fonts change the page height after load; keep trigger positions accurate.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      stop();
    };
  }, []);

  useLayoutEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
};

export default SmoothScroll;
