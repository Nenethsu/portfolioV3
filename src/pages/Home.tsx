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

const Home = () => {
  const navigate = useNavigate();
  const onNavigate = (section: string) => navigate(`/${section}`);
  const featured = projectsData.slice(0, 2);
  // One project fills the row as a wide card instead of leaving half of it empty.
  const single = featured.length === 1;

  return (
    <div className="space-y-6">
      <div className="dashboard-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="max-w-2xl">
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
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("projects")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Explore projects <FiArrowUpRight />
              </button>
              <button
                onClick={() => onNavigate("contact")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                Let&apos;s connect
              </button>
            </div>
          </div>
          <img
            src={AboutImage}
            alt="Kenneth San Pedro"
            className="order-first mx-auto h-48 w-48 shrink-0 object-contain sm:h-56 sm:w-56 lg:order-none lg:-my-4 lg:mx-0 lg:h-72 lg:w-72 xl:h-80 xl:w-80"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div
            key={label}
            className="dashboard-panel flex items-start justify-between p-5"
          >
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {note}
              </p>
            </div>
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all
            </button>
          </div>
          <div className={`grid gap-4 ${single ? "" : "md:grid-cols-2"}`}>
            {featured.map((project) => (
              <article
                key={project.id}
                className={`dashboard-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-lg ${single ? "lg:grid lg:grid-cols-2" : ""}`}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className={`w-full object-cover ${single ? "aspect-video lg:h-full" : "h-40"}`}
                />
                <div
                  className={`space-y-3 p-4 ${single ? "lg:flex lg:flex-col lg:justify-center lg:p-6" : ""}`}
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
                      className="text-slate-400 hover:text-blue-600"
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
        <div className="dashboard-panel p-5">
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
