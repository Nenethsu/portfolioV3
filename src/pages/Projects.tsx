import { useMemo, useRef, useState } from "react";
import { FiCalendar, FiExternalLink, FiGithub, FiSearch } from "react-icons/fi";
import ProjectLink from "../components/ProjectLink";
import { projectsData } from "../data/projectData";
import { useGsap } from "../hooks/useGsap";
import { CLEAR, freeze, gsap, introHeader } from "../lib/motion";

const Projects = () => {
  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const types = [
    "All",
    ...new Set(projectsData.map((project) => project.type)),
  ];
  const filteredProjects = useMemo(
    () =>
      projectsData.filter(
        (project) =>
          (activeType === "All" || project.type === activeType) &&
          `${project.title} ${project.description} ${project.technologies.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [activeType, query],
  );
  // One result fills the row as a wide card instead of a lone tile.
  const single = filteredProjects.length === 1;
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const resultKey = filteredProjects.map((project) => project.id).join();

  useGsap(root, (el) => {
    const q = gsap.utils.selector(el);
    introHeader(q("[data-anim=header]")[0])
      .from(q("[data-anim=search]"), { x: 30, autoAlpha: 0 }, 0.2)
      .from(q("[data-anim=filters]"), { y: 12, autoAlpha: 0 }, 0.35);
  });

  // Cards flip up in 3D on first load and again whenever the filter or search changes the results.
  useGsap(
    grid,
    (el) => {
      const q = gsap.utils.selector(el);
      const cards = q("[data-anim=project]");
      const images = q("[data-anim=project] img");
      freeze([...cards, ...images]);
      gsap
        .timeline({ delay: 0.15 })
        .from(cards, {
          rotationX: -40,
          y: 80,
          autoAlpha: 0,
          transformPerspective: 1200,
          transformOrigin: "50% 0%",
          duration: 1,
          stagger: 0.12,
          ease: "power4.out",
          clearProps: CLEAR,
        })
        .from(
          images,
          {
            scale: 1.3,
            duration: 1.4,
            stagger: 0.12,
            ease: "power2.out",
            clearProps: CLEAR,
          },
          0,
        )
        .from(
          q("[data-anim=project] [data-anim=badge]"),
          { x: -20, autoAlpha: 0, stagger: 0.12 },
          0.4,
        );
    },
    [resultKey],
  );

  return (
    <div ref={root} className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div data-anim="header">
          <p className="section-eyebrow">Work library</p>
          <h2 className="section-title">Projects</h2>
          <p className="section-copy">
            Browse the applications and interfaces I&apos;ve built across
            front-end and full-stack work.
          </p>
        </div>
        <div data-anim="search" className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-base sm:text-sm outline-none transition focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-600"
          />
        </div>
      </div>
      <div data-anim="filters" className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`h-10 rounded-lg px-4 text-xs font-semibold transition ${activeType === type ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-700"}`}
          >
            {type}
          </button>
        ))}
      </div>
      <div ref={grid}>
        {filteredProjects.length ? (
          <div
            className={`grid gap-5 ${single ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}
          >
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                data-anim="project"
                className={`dashboard-panel group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl ${single ? "md:grid md:grid-cols-[1.2fr_1fr]" : ""}`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className={`w-full object-cover transition duration-500 group-hover:scale-105 ${single ? "aspect-video md:h-full" : "h-48"}`}
                  />
                  <span
                    data-anim="badge"
                    className="absolute left-4 top-4 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-slate-950/90 dark:text-blue-400"
                  >
                    {project.type}
                  </span>
                </div>
                <div
                  className={`flex flex-col gap-4 p-5 ${single ? "md:justify-center lg:p-8" : ""}`}
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {project.description}
                    </p>
                  </div>
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
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <FiCalendar /> {project.date}
                    </span>
                    <div className="flex gap-2">
                      <ProjectLink
                        href={project.link}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-700"
                        aria-label={`Open ${project.title} live demo`}
                      >
                        <FiExternalLink />
                      </ProjectLink>
                      <a
                        href={project.codelink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-700"
                        aria-label={`Open ${project.title} source code`}
                      >
                        <FiGithub />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-panel p-10 text-center text-sm text-slate-500">
            No projects match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
