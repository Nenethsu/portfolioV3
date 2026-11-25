import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () =>
  window.matchMedia(REDUCED_MOTION).matches;

/** Inline styles GSAP leaves behind; cleared so Tailwind hover transforms work again. */
export const CLEAR = "transform,opacity,visibility,transition";

/** Turns off Tailwind's CSS transition on targets so it doesn't smear GSAP's per-frame updates. */
export const freeze = (targets: gsap.TweenTarget) =>
  gsap.set(targets, { transition: "none" });

let lenis: Lenis | null = null;

/** Starts Lenis on the GSAP ticker so smooth scroll and ScrollTrigger share one frame loop. */
export const startSmoothScroll = () => {
  if (prefersReducedMotion()) return () => {};
  const instance = new Lenis({ lerp: 0.1 });
  const tick = (time: number) => instance.raf(time * 1000);
  instance.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  lenis = instance;
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
};

/** Freezes page scrolling (e.g. while the mobile menu is open) and releases it again. */
export const setScrollLocked = (locked: boolean) => {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
};

export const scrollToTop = () => {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
};

/** Header intro shared by every page: eyebrow slides in, title words rise out of a mask, copy fades up. */
export const introHeader = (header: Element | null) => {
  const tl = gsap.timeline();
  if (!header) return tl;
  const eyebrow = header.querySelector(".section-eyebrow");
  const title = header.querySelector("h2");
  const copy = header.querySelectorAll("p:not(.section-eyebrow)");
  if (eyebrow) tl.from(eyebrow, { x: -24, autoAlpha: 0, duration: 0.6 });
  if (title) {
    const split = SplitText.create(title, { type: "words", mask: "words" });
    tl.from(
      split.words,
      { yPercent: 110, duration: 0.9, stagger: 0.07, ease: "expo.out" },
      "-=0.35",
    );
  }
  if (copy.length)
    tl.from(copy, { y: 16, autoAlpha: 0, stagger: 0.1 }, "-=0.6");
  return tl;
};

export { gsap, ScrollTrigger, SplitText };
