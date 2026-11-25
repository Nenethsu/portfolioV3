import { useRef } from "react";
import { FiBriefcase, FiCalendar } from "react-icons/fi";
import { useGsap } from "../hooks/useGsap";
import { gsap, introHeader } from "../lib/motion";

const Experience = () => {
  const root = useRef<HTMLDivElement>(null);

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    const tl = introHeader(q("[data-anim=header]")[0]);
    tl.from(q("[data-anim=panel]"), { y: 30, autoAlpha: 0 }, "-=0.5");

    // Build the timeline entry by entry: icon spins in, the line draws down, details slide in.
    q("[data-anim=entry]").forEach((entry, index) => {
      const e = gsap.utils.selector(entry);
      tl.from(
        e("[data-anim=icon]"),
        { scale: 0, rotation: -120, duration: 0.7, ease: "back.out(2)" },
        index ? "-=0.35" : "-=0.3",
      ).from(
        e("[data-anim=content] > *"),
        { x: 40, autoAlpha: 0, stagger: 0.08, duration: 0.6 },
        "<0.15",
      );
      // The last entry has no connecting line.
      const line = e("[data-anim=line]");
      if (line.length)
        tl.from(
          line,
          {
            scaleY: 0,
            transformOrigin: "50% 0%",
            duration: 0.8,
            ease: "power2.inOut",
          },
          "<0.1",
        );
    });

    // "Present" badge breathes like a live status light.
    gsap.fromTo(
      q("[data-anim=pill]"),
      { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.45)" },
      {
        boxShadow: "0 0 0 10px rgba(16, 185, 129, 0)",
        duration: 1.8,
        ease: "power1.out",
        repeat: -1,
        delay: tl.duration(),
      },
    );
  });

  return (
    <div ref={root} className="space-y-5">
      <div data-anim="header">
        <p className="section-eyebrow">Career timeline</p>
        <h2 className="section-title">Experience</h2>
        <p className="section-copy">
          My professional experience at Dynamic Global Soft Inc.
        </p>
      </div>
      <div data-anim="panel" className="dashboard-panel p-6 sm:p-8">
        <div>
          <div data-anim="entry" className="flex gap-5">
            <div className="flex shrink-0 flex-col items-center">
              <div
                data-anim="icon"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
              >
                <FiBriefcase />
              </div>
              <div
                data-anim="line"
                className="my-2 w-px flex-1 bg-blue-100 dark:bg-blue-500/20"
              />
            </div>
            <div data-anim="content" className="space-y-3 pb-8">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Frontend Developer
                </h3>
                <span data-anim="pill" className="status-pill">
                  Present
                </span>
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Dynamic Global Soft Inc. · Probationary Employee with a position
                as a Frontend Developer
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FiCalendar /> June 9, 2026 - Present
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                Working as a Frontend Developer at Dynamic Global Soft Inc.
              </p>
            </div>
          </div>
          <div data-anim="entry" className="flex gap-5">
            <div
              data-anim="icon"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              <FiBriefcase />
            </div>
            <div data-anim="content" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Frontend Developer Intern
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Internship
                </span>
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Dynamic Global Soft Inc.
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FiCalendar /> February 27, 2026 - April 22, 2026
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                Completed a frontend development internship at Dynamic Global
                Soft Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
