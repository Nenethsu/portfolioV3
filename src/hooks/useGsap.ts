import { useLayoutEffect, type DependencyList, type RefObject } from "react";
import { gsap } from "../lib/motion";

type Setup = (scope: HTMLElement) => void | (() => void);

/**
 * Runs GSAP code scoped to `scope` and reverts all of it (tweens, ScrollTriggers, SplitText)
 * on unmount or when `deps` change. Nothing runs when the user prefers reduced motion.
 */
export const useGsap = (
  scope: RefObject<HTMLElement | null>,
  setup: Setup,
  deps: DependencyList = [],
) => {
  useLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;
    const mm = gsap.matchMedia(element);
    mm.add("(prefers-reduced-motion: no-preference)", () => setup(element));
    return () => mm.revert();
    // The caller owns the dependency list; `setup` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
