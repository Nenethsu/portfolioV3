import { useRef } from "react";
import {
  FiArrowUpRight,
  FiBriefcase,
  FiCheckCircle,
  FiCode,
  FiFolder,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { projectsData } from "../data/projectData";
import { skillsData } from "../data/skillsData";
import AboutImage from "../assets/AboutImage.png";
import { useGsap } from "../hooks/useGsap";
import { CLEAR, freeze, gsap, introHeader } from "../lib/motion";

const Home = () => {
  const navigate = useNavigate();
  const onNavigate = (section: string) => navigate(`/${section}`);
  const featured = projectsData.slice(0, 2);
  // One project fills the row as a wide card instead of leaving half of it empty.
  const single = featured.length === 1;
  const root = useRef<HTMLDivElement>(null);

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    const actions = q("[data-anim=actions] > *");
    const avatar = q("[data-anim=avatar]");
    const cards = q("[data-anim=featured]");
    freeze([...actions, ...cards]);

    const tl = introHeader(q("[data-anim=header]")[0]);
    tl.from(
      actions,
      { y: 20, autoAlpha: 0, stagger: 0.1, clearProps: CLEAR },
      "-=0.5",
    )
      .from(
        avatar,
        {
          scale: 0.3,
          rotation: -14,
          autoAlpha: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.55)",
        },
        0.15,
      )
      .from(q("[data-anim=stat]"), { y: 40, autoAlpha: 0, stagger: 0.08 }, 0.5);
    q("[data-anim=count]").forEach((node) =>
      tl.from(
        node,
        {
          textContent: 0,
          snap: { textContent: 1 },
          duration: 1.4,
          ease: "power2.out",
        },
        0.6,
      ),
    );

    // Gentle idle float once the pop-in has settled.
    gsap.to(avatar, {
      y: -14,
      rotation: 2,
      duration: 2.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.6,
    });

    gsap.from(cards, {
      y: 60,
      autoAlpha: 0,
      stagger: 0.15,
      clearProps: CLEAR,
      scrollTrigger: { trigger: cards[0], start: "top 88%" },
    });
    gsap.from(q("[data-anim=connect]"), {
      x: 40,
      autoAlpha: 0,
      scrollTrigger: { trigger: q("[data-anim=connect]")[0], start: "top 88%" },
    });
  });

  return (
    <div ref={root} className="space-y-6">
      <div className="dashboard-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div data-anim="header" className="max-w-2xl">
            <p className="section-eyebrow">Developer workspace</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Welcome back, I&apos;m Ken
              <span className="text-blue-600 dark:text-blue-400">.</span>
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
              An aspiring web developer from Binangonan, Rizal, Philippines.
              I&apos;m focused on building responsive, user-friendly interfaces
              while continuously improving my development skills.
            </p>
            <div
              data-anim="actions"
              className="mt-6 grid gap-3 sm:flex sm:flex-wrap"
            >
              <button
                onClick={() => onNavigate("projects")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Explore projects <FiArrowUpRight />
              </button>
              <button
                onClick={() => onNavigate("contact")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                Let&apos;s connect
              </button>
            </div>
          </div>
          <img
            data-anim="avatar"
            src={AboutImage}
            alt="Kenneth San Pedro"
            className="order-first mx-auto h-40 w-40 shrink-0 object-contain sm:h-56 sm:w-56 lg:order-none lg:-my-4 lg:mx-0 lg:h-72 lg:w-72 xl:h-80 xl:w-80"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          {
            label: "Projects",
            value: projectsData.length,
            icon: FiFolder,
            note: "Published work",
          },
          {
            label: "Technologies",
            value: skillsData.length,
            icon: FiCode,
            note: "In my toolkit",
          },
          {
            label: "Experience",
            value: "Present",
            icon: FiBriefcase,
            note: "Frontend Developer",
          },
          {
            label: "Company",
            value: "DGS",
            icon: FiCheckCircle,
            note: "Dynamic Global Soft Inc.",
          },
        ].map(({ label, value, icon: Icon, note }) => (
          // Phones: icon on top so the two-column cards keep room for the value.
          <div
            key={label}
            data-anim="stat"
            className="dashboard-panel flex flex-col-reverse justify-end gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <p
                data-anim={typeof value === "number" ? "count" : undefined}
                className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-2xl"
              >
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {note}
              </p>
            </div>
            <span className="self-start rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:p-3">
              <Icon />
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-eyebrow">Selected work</p>
              <h2 className="section-title">Featured projects</h2>
            </div>
            <button
              onClick={() => onNavigate("projects")}
              className="-my-2 shrink-0 px-1 py-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all
            </button>
          </div>
          <div className={`grid gap-4 ${single ? "" : "md:grid-cols-2"}`}>
            {featured.map((project) => (
              <article
                key={project.id}
                data-anim="featured"
                className={`dashboard-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-lg ${single ? "md:grid md:grid-cols-2" : ""}`}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className={`w-full object-cover ${single ? "aspect-video md:h-full" : "h-40"}`}
                />
                <div
                  className={`space-y-3 p-4 ${single ? "md:flex md:flex-col md:justify-center md:p-6" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {project.title}
                    </h3>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${project.title}`}
                      className="-m-3 p-3 text-slate-400 hover:text-blue-600"
                    >
                      <FiArrowUpRight />
                    </a>
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div data-anim="connect" className="dashboard-panel p-5">
          <p className="section-eyebrow">Profile</p>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Connect with me
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Follow my work and reach out if you&apos;d like to collaborate or
            discuss an opportunity.
          </p>
          <div className="mt-6 space-y-3">
            <a
              href="https://github.com/Nenethsu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:text-blue-400"
            >
              <FiGithub /> GitHub <FiArrowUpRight className="ml-auto" />
            </a>
            <a
              href="https://www.linkedin.com/in/san-pedro-kenneth-j-49933329a/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:text-blue-400"
            >
              <FiLinkedin /> LinkedIn <FiArrowUpRight className="ml-auto" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
