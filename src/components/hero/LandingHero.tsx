/**
 * Landing hero, the first viewport of the classic page (spec 03). Server
 * component; only the door (HeroRoom) is a client component.
 *
 * There is no JS entrance: everything is CSS that (re)starts whenever the
 * classic wrapper goes from display:none to visible, which is first paint on
 * a direct classic load and the data-view flip after the intro, a skip or a
 * return from the room. The name letters run name-in (suppressed under
 * html[data-been-inside]), and the door runs mini-room-settle, -float and
 * -shadow from phase 0.
 */

import { HERO } from "@/content/hero";
import { HeroName } from "./HeroName";
import { HeroRoom } from "./HeroRoom";

/**
 * Roles joined with " · ". Spaces inside a role become no-break spaces, so a
 * narrow column wraps between roles (after a separator) and never splits one.
 */
function roleLine(roles: string[]): string {
  return roles.map((role) => role.replace(/ /g, " ")).join(" · ");
}

export function LandingHero() {
  const { prompt, name, roles, description, ctas, door } = HERO;
  return (
    <section className="relative flex min-h-[86svh] items-center justify-center px-6 pb-20 pt-28">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-x-8 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="hero-prompt mb-5 select-none font-mono text-xs text-gray-2 md:text-[13px]">
            <span className="text-mint">{`${prompt.user}@${prompt.host}`}</span>
            {`:${prompt.path}$ ${prompt.command}`}
          </p>
          <HeroName name={name} />
          <p className="mt-6 font-mono text-[13px] text-gray-1 md:text-base">{roleLine(roles)}</p>
          <p className="mt-5 max-w-xl leading-relaxed text-gray-2">{description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
            {ctas.map((cta) => (
              <a key={cta.href} href={cta.href} className={cta.variant === "light" ? "key key-light" : "key"}>
                {cta.label}
              </a>
            ))}
          </div>
        </div>
        <HeroRoom door={door} />
      </div>
    </section>
  );
}
