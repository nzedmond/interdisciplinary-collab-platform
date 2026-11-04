import { BookOpen, Briefcase, ExternalLink, FileText, GraduationCap, Mail } from "lucide-react";
import type { UserProfile } from "@/lib/types";

type ProfileViewProps = {
  profile: UserProfile;
  // Shown in place of empty sections, e.g. a prompt to fill them in on your own profile.
  emptyHint?: string;
};

const roleLabels: Record<UserProfile["role"], string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Administrator"
};

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Icon className="h-4 w-4 text-coral" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Paragraphs({ text, emptyHint }: { text?: string | null; emptyHint?: string }) {
  if (!text) {
    return <p className="text-sm italic text-ink/50">{emptyHint ?? "Not provided."}</p>;
  }

  return (
    <div className="space-y-2">
      {text.split(/\n+/).map((paragraph, index) => (
        <p key={index} className="text-sm leading-6 text-ink/75">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function Tags({ items, tone, emptyHint }: { items: string[]; tone: "moss" | "blue"; emptyHint?: string }) {
  if (items.length === 0) {
    return <p className="text-sm italic text-ink/50">{emptyHint ?? "None listed."}</p>;
  }

  const toneClass = tone === "moss" ? "bg-moss/10 text-moss" : "bg-blue/10 text-blue";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function ProfileView({ profile, emptyHint }: ProfileViewProps) {
  const links = [
    { label: "Portfolio", href: profile.portfolioUrl },
    { label: "GitHub", href: profile.githubUrl },
    { label: "Resume", href: profile.resumeUrl }
  ].filter((link): link is { label: string; href: string } => typeof link.href === "string" && link.href.length > 0);

  const subtitle = [
    profile.majorOrTitle,
    profile.department,
    profile.graduationYear ? `Class of ${profile.graduationYear}` : undefined
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">{roleLabels[profile.role]}</span>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-ink">{profile.name}</h1>
        {subtitle.length > 0 ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink/70">
            <GraduationCap className="h-4 w-4 shrink-0 text-coral" />
            {subtitle.join(" · ")}
          </p>
        ) : null}
        {profile.email ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink/70">
            <Mail className="h-4 w-4 shrink-0 text-coral" />
            <a href={`mailto:${profile.email}`} className="hover:text-moss hover:underline">
              {profile.email}
            </a>
          </p>
        ) : null}
        {links.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Section title="About" icon={FileText}>
            <Paragraphs text={profile.bio} emptyHint={emptyHint} />
          </Section>
          <Section title="Project experience" icon={Briefcase}>
            <Paragraphs text={profile.experience} emptyHint={emptyHint} />
          </Section>
          <Section title="Relevant coursework" icon={BookOpen}>
            <Paragraphs text={profile.coursework} emptyHint={emptyHint} />
          </Section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Skills</h2>
            <div className="mt-3">
              <Tags items={profile.skills} tone="moss" emptyHint={emptyHint} />
            </div>
          </section>
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Interests</h2>
            <div className="mt-3">
              <Tags items={profile.interests} tone="blue" emptyHint={emptyHint} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
