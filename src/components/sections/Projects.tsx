/**
 * Work / Projects (spec 06). Server component: only BlurFade (reveal),
 * MagicCard (hover spotlight), next/image and the lucide icons hydrate.
 *
 * A 2-column grid (1 column below md) of equal-height cards. Each card has a
 * 176/192px preview strip (top-aligned screenshot fading into the card, or a
 * dotted "screenshot coming soon" placeholder) and a body with the title, an
 * link icon, the description and tech chips. A project with no link shows no
 * icon and its preview is not clickable; an in-page link ("#homelab") opens in
 * the same tab with an arrow icon. Equal heights come from
 * the h-full / flex-1 chain: BlurFade.h-full, MagicCard.h-full flex-col, body
 * flex-1, description flex-1, so chip rows align at the bottom of each row.
 */

import Image from "next/image";
import { ArrowDownRight, ExternalLink, SquareTerminal } from "lucide-react";
import { DEVICON, PROJECTS, SECTIONS, type Project } from "@/content";
import { cn } from "@/lib/cn";
import { BlurFade } from "@/components/ui/BlurFade";
import { MagicCard } from "@/components/ui/MagicCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Devicon "original" artwork on the jsDelivr GitHub mirror (unpinned, like the original). */
function deviconUrl(slug: string): string {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
}

/** Icon chip for allow-listed techs, accent chip for everything else. */
function TechChip({ tech }: { tech: string }) {
  const slug = DEVICON[tech];
  if (slug) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-white/[0.04] text-gray-1 border border-line-strong">
        {/* Plain <img> on purpose: decorative remote SVG, no optimizer or remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={deviconUrl(slug)} alt="" className="w-3.5 h-3.5" />
        {tech}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-sec/10 text-sec border border-sec/20">
      {tech}
    </span>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  if (project.preview) {
    return (
      <div className="relative w-full h-44 md:h-48 border-b border-line">
        <Image
          src={project.preview}
          alt={`${project.name} preview`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-44 md:h-48 dot-grid bg-raised flex flex-col items-center justify-center gap-2 border-b border-line">
      <SquareTerminal className="w-6 h-6 text-sec/50" aria-hidden="true" />
      <p className="font-mono text-[11px] text-gray-2">./previews/{project.placeholderFile}</p>
      <p className="font-mono text-[10px] tracking-widest uppercase text-sec/60">screenshot coming soon</p>
    </div>
  );
}

/** Link attributes: in-page anchors stay in the tab, everything else opens a new one. */
function linkProps(link: string) {
  return link.startsWith("#") ? { href: link } : { href: link, target: "_blank", rel: "noopener noreferrer" };
}

function ProjectCard({ project }: { project: Project }) {
  const { link } = project;
  const internal = link.startsWith("#");
  return (
    <MagicCard className="h-full !p-0 overflow-hidden flex flex-col">
      {link ? (
        /* Duplicate of the title link, kept out of the tab order and the a11y tree. */
        <a
          {...linkProps(link)}
          className="block relative w-full overflow-hidden group shrink-0"
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProjectPreview project={project} />
        </a>
      ) : (
        <div className="relative w-full overflow-hidden group shrink-0">
          <ProjectPreview project={project} />
        </div>
      )}
      <div className="flex flex-col flex-1 p-6">
        <div className={cn("flex items-start mb-3", link && "justify-between")}>
          <h3 className="display text-[1.7rem] leading-[0.95] text-title">{project.name}</h3>
          {link ? (
            <a
              {...linkProps(link)}
              className="ml-3 shrink-0 text-gray-3 hover:text-sec transition-colors"
              aria-label={internal ? `Go to ${project.name}` : `View ${project.name}`}
            >
              {internal ? <ArrowDownRight size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
            </a>
          ) : null}
        </div>
        <p className="text-white/60 text-sm leading-relaxed flex-1 mb-5">{project.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <TechChip key={tech} tech={tech} />
          ))}
        </div>
      </div>
    </MagicCard>
  );
}

export function Projects() {
  const meta = SECTIONS.projects;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {PROJECTS.map((project, i) => (
            <BlurFade key={project.slug} delay={i * 0.08} className="h-full">
              <ProjectCard project={project} />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
