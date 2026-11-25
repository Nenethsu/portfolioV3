import portfolio from "../assets/portfolio.jpg";
import tinygpt from "../assets/tinygpt.jpg";

export interface ProjectCardProps {
  image: string;
  title: string;
  description: string;
  type: string;
  link: string;
  codelink: string;
  date: string;
  technologies: string[];
}

export const projectsData = [
  {
    id: 3,
    title: "Tiny GPT",
    type: "AI",
    description:
      "A 4.8M-parameter language model I built and trained from scratch. It writes short stories one letter at a time and runs right in your browser, with no server or API.",
    image: tinygpt,
    link: "/lab",
    codelink: "https://github.com/Nenethsu/tiny-gpt",
    date: "Nov 25, 2026",
    technologies: ["PyTorch", "TypeScript", "Web Workers", "React"],
  },
  {
    id: 2,
    title: "Personal Portfolio V2",
    type: "Frontend",
    description:
      "My second version portfolio website , created using ReactJS and TailwindCSS.",
    image: portfolio,
    link: "https://sanpedrokenneth.netlify.app/",
    codelink: "https://github.com/Nenethsu/My-Portfolio-V2",
    date: "May 23, 2023",
    technologies: ["React", "Tailwind CSS"],
  },
];
