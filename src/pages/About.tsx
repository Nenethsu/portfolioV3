import { useRef } from "react";
import {
  FiArrowUpRight,
  FiGithub,
  FiInstagram,
  FiLinkedin,
} from "react-icons/fi";
import AboutImage from "../assets/AboutImage.png";
import { useGsap } from "../hooks/useGsap";
import { gsap, introHeader, SplitText } from "../lib/motion";

const About = () => {
  const root = useRef<HTMLDivElement>(null);

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    const panel = q("[data-anim=panel]")[0] as HTMLElement;
    const tilt = q("[data-anim=tilt]")[0];
    const portrait = q("[data-anim=portrait]");
    const name = SplitText.create(q("[data-anim=bio] h3"), { type: "chars" });

    introHeader(q("[data-anim=header]")[0])
      .from(panel, { y: 30, autoAlpha: 0 }, "-=0.5")
      // Portrait opens from a point like a camera iris.
      .fromTo(
        portrait,
        { clipPath: "circle(0% at 50% 50%)" },
        {
          clipPath: "circle(75% at 50% 50%)",
          duration: 1.2,
          ease: "expo.inOut",
          clearProps: "clipPath",
        },
        "-=0.4",
      )
      .from(
        name.chars,
        { autoAlpha: 0, y: 12, stagger: 0.025, duration: 0.4 },
        "-=0.7",
      )
      .from(
        q("[data-anim=bio] p"),
        { y: 20, autoAlpha: 0, stagger: 0.12 },
        "-=0.3",
      )
      .from(
        q("[data-anim=links] a"),
        { scale: 0.6, autoAlpha: 0, stagger: 0.08, ease: "back.out(2)" },
        "-=0.4",
      );

    gsap.to(portrait, {
      y: -10,
      duration: 2.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    // The portrait leans toward the cursor in 3D.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    gsap.set(tilt, { transformPerspective: 800 });
    const rotateX = gsap.quickTo(tilt, "rotationX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(tilt, "rotationY", {
      duration: 0.6,
      ease: "power3.out",
    });
    const onMove = (event: PointerEvent) => {
      const box = panel.getBoundingClientRect();
      rotateY(((event.clientX - box.left) / box.width - 0.5) * 24);
      rotateX(((event.clientY - box.top) / box.height - 0.5) * -24);
    };
    const onLeave = () => {
      rotateX(0);
      rotateY(0);
    };
    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerleave", onLeave);
    return () => {
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
    };
  });

  return (
    <div ref={root} className="space-y-5">
      <div data-anim="header">
        <p className="section-eyebrow">Profile</p>
        <h2 className="section-title">About Me</h2>
        <p className="section-copy">
          A little context about the person behind the projects.
        </p>
      </div>
      <div
        data-anim="panel"
        className="dashboard-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[240px_1fr] lg:items-center"
      >
        <div data-anim="tilt" className="flex justify-center">
          <img
            data-anim="portrait"
            src={AboutImage}
            alt="About Kenneth San Pedro"
            className="h-56 w-56 object-contain"
          />
        </div>
        <div data-anim="bio">
          <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
            Aspiring web developer
          </h3>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
            I&apos;m an aspiring web developer from Binangonan, Rizal,
            Philippines. I have a strong interest in games and programming,
            which I explore during my free time, and I primarily specialize in
            front-end web development.
          </p>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
            My programming journey became more focused as a fourth-year IT
            student preparing for my internship. With graduation approaching,
            I&apos;m motivated to continuously improve my skills and contribute
            to thoughtful, user-friendly experiences.
          </p>
          <div data-anim="links" className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://github.com/Nenethsu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-700"
            >
              <FiGithub /> GitHub <FiArrowUpRight />
            </a>
            <a
              href="https://www.instagram.com/nenethss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-700"
            >
              <FiInstagram /> Instagram <FiArrowUpRight />
            </a>
            <a
              href="https://www.linkedin.com/in/san-pedro-kenneth-j-49933329a/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-700"
            >
              <FiLinkedin /> LinkedIn <FiArrowUpRight />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
