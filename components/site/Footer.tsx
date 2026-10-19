import Link from "next/link";
import { siteConfig, footerNav, primaryNav } from "@/lib/config/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-6 bg-band pt-12 pb-7 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Link href="/" aria-label="TeknoKini, ke beranda">
              <Logo inverted />
            </Link>
            <p className="mt-4 max-w-[44ch] text-sm text-band-muted">{siteConfig.description}</p>
          </div>
          <nav aria-label="Topik">
            <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-widest text-band-muted uppercase">Topik</h3>
            <ul className="grid gap-2">
              {primaryNav
                .filter((item) => item.href !== "/")
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm hover:text-brand-300">
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <nav aria-label={siteConfig.name}>
            <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-widest text-band-muted uppercase">
              {siteConfig.name}
            </h3>
            <ul className="grid gap-2">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-brand-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-5 font-mono text-[11.5px] text-band-muted">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
          <span>{siteConfig.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
