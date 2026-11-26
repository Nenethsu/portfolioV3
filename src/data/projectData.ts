import portfolio from "../assets/portfolio.jpg";

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
