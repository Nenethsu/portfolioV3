import { flushSync } from "react-dom";
import { prefersReducedMotion } from "./motion";

const DURATION = 700;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Runs a theme change as a circular reveal that grows out of `origin` (the toggle button).
 * Uses the View Transition API: the browser snapshots the old page, `apply` switches the theme,
 * then the new page is clipped to a circle that expands until it covers the viewport.
 * Without the API, or with reduced motion on, the theme just switches at once.
 */
export const revealTheme = (origin: HTMLElement | null, apply: () => void) => {
  if (
    !origin ||
    typeof document.startViewTransition !== "function" ||
    prefersReducedMotion()
  ) {
    apply();
    return;
  }

  const { left, top, width, height } = origin.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  // Distance to the farthest corner, so the circle ends up covering the whole screen.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  // Color transitions would replay inside the new snapshot; the reveal is the transition.
  root.classList.add("theme-switching");

  const transition = document.startViewTransition(() => {
    // The DOM must be in the new theme before this callback returns.
    flushSync(apply);
  });

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: DURATION,
          easing: EASING,
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      // Transition skipped (e.g. a second click mid-reveal); the theme is still applied.
    });

  transition.finished
    .catch(() => {})
    .finally(() => root.classList.remove("theme-switching"));
};
