import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Pages on this site ("/lab") open in place; anything else opens in a new tab. */
const ProjectLink = ({ href, ...props }: Props) =>
  href.startsWith("/") ? (
    <Link to={href} {...props} />
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
  );

export default ProjectLink;
