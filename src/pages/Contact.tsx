import { useRef } from "react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";
import {
  FiArrowUpRight,
  FiGithub,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { useGsap } from "../hooks/useGsap";
import { gsap, introHeader } from "../lib/motion";

const Contact = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    introHeader(q("[data-anim=header]")[0])
      .from(
        q("[data-anim=info]"),
        { x: -60, autoAlpha: 0, duration: 0.9 },
        "-=0.5",
      )
      .from(q("[data-anim=form]"), { x: 60, autoAlpha: 0, duration: 0.9 }, "<")
      .from(
        q("[data-anim=info] a, [data-anim=info] p.flex"),
        { x: -16, autoAlpha: 0, stagger: 0.08 },
        "-=0.4",
      )
      .from(
        q("[data-anim=form] label"),
        { y: 24, autoAlpha: 0, stagger: 0.1 },
        "<",
      )
      .from(
        q("[data-anim=send]"),
        { scale: 0.8, autoAlpha: 0, ease: "back.out(2.5)" },
        "-=0.3",
      );

    // Magnetic send button: it leans toward the cursor and springs back on leave.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const button = q("[data-anim=send]")[0] as HTMLElement;
    const moveX = gsap.quickTo(button, "x", {
      duration: 0.4,
      ease: "power3.out",
    });
    const moveY = gsap.quickTo(button, "y", {
      duration: 0.4,
      ease: "power3.out",
    });
    const onMove = (event: PointerEvent) => {
      const box = button.getBoundingClientRect();
      moveX((event.clientX - box.left - box.width / 2) * 0.35);
      moveY((event.clientY - box.top - box.height / 2) * 0.35);
    };
    const onLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
        overwrite: true,
      });
    };
    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);
    return () => {
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", onLeave);
    };
  });
  const sendEmail = (event: React.FormEvent) => {
    event.preventDefault();
    const sendingToast = toast.loading("Sending your message...");
    if (!formRef.current) return;
    emailjs
      .sendForm(
        "service_kjmwztj",
        "template_v26016l",
        formRef.current,
        "VYnyVI5S5FY0jPK0N",
      )
      .then(
        () => {
          toast.success("Message sent successfully!", { id: sendingToast });
          formRef.current?.reset();
        },
        (error) => {
          toast.error("Failed to send. Please try again.", {
            id: sendingToast,
          });
          console.error(error);
        },
      );
  };

  return (
    <div ref={root} className="space-y-5">
      <div data-anim="header">
        <p className="section-eyebrow">Get in touch</p>
        <h2 className="section-title">Contact</h2>
        <p className="section-copy">
          Have an opportunity or a project in mind? Send a message and I&apos;ll
          get back to you.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div data-anim="info" className="dashboard-panel space-y-5 p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              Let&apos;s talk
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              I&apos;m open to conversations about internships, front-end
              development, and collaborative projects.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <a
              href="mailto:kennethsanpedro1108@gmail.com"
              className="flex items-center gap-3 break-all py-1 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <FiMail className="shrink-0 text-blue-600" />{" "}
              kennethsanpedro1108@gmail.com
            </a>
            <p className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <FiPhone className="text-blue-600" /> +639267353866
            </p>
            <p className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <FiMapPin className="text-blue-600" /> Binangonan, Rizal,
              Philippines
            </p>
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            <a
              href="https://github.com/Nenethsu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700"
            >
              <FiGithub />
            </a>
            <a
              href="https://www.instagram.com/nenethss"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700"
            >
              <FiInstagram />
            </a>
            <a
              href="https://www.linkedin.com/in/san-pedro-kenneth-j-49933329a/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700"
            >
              <FiLinkedin />
            </a>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=kennethsanpedro1108@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Gmail"
              className="ml-auto inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Open Gmail <FiArrowUpRight />
            </a>
          </div>
        </div>
        <form
          ref={formRef}
          data-anim="form"
          onSubmit={sendEmail}
          className="dashboard-panel space-y-4 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Your name
              <input
                name="name"
                type="text"
                required
                placeholder="Your Name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-base font-normal sm:text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Your email
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-base font-normal sm:text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>
          <label className="block space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            Message
            <textarea
              name="message"
              required
              placeholder="Tell me a little about your project..."
              className="mt-1 h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-base font-normal sm:text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <button
            type="submit"
            data-anim="send"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 sm:w-auto text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Send message <FiArrowUpRight className="ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
