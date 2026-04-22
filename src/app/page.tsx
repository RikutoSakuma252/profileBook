import Link from "next/link";
import {
  getLatestProfileWithFields,
  getProfileCount,
  getRecentProfiles,
} from "@/lib/prisma";

export const revalidate = 60;

const ambientDeco = (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
    <div className="absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
    <div className="absolute left-0 top-[38%] h-px w-full bg-gradient-to-r from-transparent via-rose/40 to-transparent" />
    <div className="absolute bottom-32 left-0 h-px w-full bg-gradient-to-r from-transparent via-paper/20 to-transparent" />
    <div className="absolute right-[6%] top-[12%] h-40 w-40 rounded-full border border-neon/20 animate-dial" />
    <div className="absolute right-[8%] top-[14%] h-36 w-36 rounded-full border border-neon/10" />
    <div className="absolute left-[4%] bottom-[18%] h-24 w-24 rounded-full border border-rose/25" />
  </div>
);

export default async function Home() {
  const [total, latestWithFields, latestRecentThree] = await Promise.all([
    getProfileCount(),
    getLatestProfileWithFields(),
    getRecentProfiles(3),
  ]);

  const latest = latestWithFields;
  const latestFields = latestWithFields?.fields ?? [];

  const latestDate = latest?.createdAt
    ? latest.createdAt.toISOString().slice(0, 10)
    : "incoming";

  return (
    <main className="relative overflow-hidden">
      {ambientDeco}

      <section className="relative mx-auto grid max-w-6xl gap-10 px-6 pt-16 pb-24 lg:grid-cols-[1.2fr_0.8fr] lg:pt-24">
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 font-typewriter text-[11px] uppercase tracking-[0.3em] text-neon/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon animate-blink" />
            File No. 001 · Confidential Transmission
          </div>

          <h1 className="font-dot text-[13vw] leading-[0.95] tracking-tight text-paper sm:text-[86px] lg:text-[104px]">
            <span className="block text-rose-dusty">ダマテン</span>
            <span className="block">
              <span className="text-neon">ラジオ</span>
              <span className="text-paper/40"> / </span>
              <span className="text-paper">名簿</span>
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-balance font-handwritten text-lg leading-relaxed text-paper/80">
            深夜の電波に乗せて届く、社内メンバーの
            <span className="relative mx-1 inline-block">
              <span className="relative z-10 text-ink">　内緒話　</span>
              <span className="absolute inset-0 -z-0 bg-neon" />
            </span>
            を、1ページずつめくってどうぞ。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/profiles"
              className="group relative inline-flex items-center gap-3 rounded-full bg-neon px-7 py-3.5 font-dot text-sm tracking-[0.2em] text-ink shadow-neon transition-transform hover:-translate-y-0.5"
            >
              <span className="h-2 w-2 rounded-full bg-ink animate-blink" />
              ダイヤルを合わせる
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <span className="font-typewriter text-xs uppercase tracking-[0.25em] text-paper/50">
              OR · tune to 93.5 FM
            </span>
          </div>

          <div className="absolute -right-2 top-8 hidden rotate-[-12deg] lg:block">
            <span className="stamp-rouge text-sm">秘 · TOP SECRET</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative rotate-[1.2deg] transition-transform hover:rotate-0">
            <span className="tape left-6 -top-3 rotate-[-4deg]" aria-hidden />
            <span className="tape right-10 -bottom-3 rotate-[6deg]" aria-hidden />

            <article className="paper-grain relative overflow-hidden rounded-sm p-7 text-ink shadow-card">
              <header className="mb-5 flex items-center justify-between border-b border-dashed border-ink/30 pb-3">
                <div className="flex items-center gap-2 font-dot text-[11px] tracking-[0.2em]">
                  <span className="inline-block h-2 w-2 bg-rouge" />
                  DOSSIER / {String(total).padStart(2, "0")}
                </div>
                <div className="font-typewriter text-[11px] uppercase tracking-[0.2em] text-ink/60">
                  rec. {latestDate}
                </div>
              </header>

              <div className="space-y-4 font-handwritten text-[15px] leading-relaxed">
                {latestFields.length === 0 ? (
                  <>
                    <Row label="📻 ラジオネーム" locked />
                    <Row label="🎭 表の顔" locked />
                    <Row label="🔥 密かな野望" locked />
                    <Row label="🤫 サボってる瞬間" locked />
                  </>
                ) : (
                  latestFields.map((f) => (
                    <Row
                      key={f.id}
                      label={`${f.emoji} ${f.label}`.trim()}
                      locked
                    />
                  ))
                )}
              </div>

              <footer className="mt-6 flex items-center justify-between border-t border-dotted border-ink/30 pt-3">
                <span className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-ink/50">
                  tap card to reveal
                </span>
                <span className="font-dot text-[11px] tracking-[0.2em] text-rouge">
                  取扱注意
                </span>
              </footer>
            </article>

            <div className="absolute -bottom-4 -left-4 rotate-[-10deg] rounded-full bg-rose px-3 py-1 font-dot text-[10px] tracking-[0.25em] text-paper shadow-md">
              NEW RECORD
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-center font-typewriter text-[11px] uppercase tracking-[0.2em] text-paper/60">
            <Stat k="Profiles" v={total > 0 ? String(total).padStart(2, "0") : "--"} />
            <Stat k="Latest" v={latestDate} />
            <Stat k="Airtime" v="24 / 7" />
          </div>
        </div>
      </section>

      <div className="mx-auto mb-10 max-w-6xl px-6 text-paper/25">
        <div className="dotted-divider" />
      </div>

      {latestRecentThree.length > 0 ? (
        <section className="mx-auto mb-16 max-w-6xl px-6">
          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <div className="font-dot text-[11px] tracking-[0.3em] text-neon">
                LATEST BROADCAST
              </div>
              <p className="mt-1 font-handwritten text-paper/70">
                最近オンエアされたメンバー
              </p>
            </div>
            <Link
              href="/profiles"
              className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/60 transition-colors hover:text-neon"
            >
              view all →
            </Link>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestRecentThree.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/profiles/${p.id}`}
                  className="group relative block rounded-sm border border-paper/10 bg-ink-soft/40 p-5 transition-colors hover:border-neon/60"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-10 w-10 place-items-center rounded-sm font-dot text-sm text-ink"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.displayName.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-dot text-sm tracking-[0.1em] text-paper group-hover:text-neon">
                        {p.displayName}
                      </div>
                      {p.subtitle ? (
                        <div className="truncate font-handwritten text-sm text-paper/60">
                          {p.subtitle}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between font-typewriter text-[10px] uppercase tracking-[0.3em] text-paper/40">
                    <span>No. {String(i + 1).padStart(2, "0")}</span>
                    <span>{p.createdAt.toISOString().slice(0, 10)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto mb-24 max-w-6xl px-6">
        <div className="flex flex-col gap-4 rounded-sm border border-paper/10 bg-ink-soft/40 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-dot text-[11px] tracking-[0.3em] text-neon">
              BROADCAST NOTICE
            </div>
            <p className="mt-2 max-w-xl font-handwritten text-base text-paper/80">
              このプロフィール帳は <span className="text-neon">@e3sys.co.jp</span> ドメインの
              メンバーだけが受信できます。合言葉は、いらない。
            </p>
          </div>
          <Link
            href="/profiles"
            className="self-start rounded-full border border-paper/20 px-5 py-2 font-typewriter text-[11px] uppercase tracking-[0.3em] text-paper/80 transition-colors hover:border-neon hover:text-neon md:self-auto"
          >
            Open Directory →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Row({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink/80">{label}</span>
      <span
        className={
          locked
            ? "select-none rounded-sm bg-ink/90 px-3 py-1 font-dot text-[11px] tracking-[0.3em] text-paper"
            : "text-ink"
        }
      >
        LOCKED
      </span>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-sm border border-paper/10 py-2">
      <div className="text-[10px] text-paper/40">{k}</div>
      <div className="mt-1 font-dot text-sm tracking-[0.15em] text-paper">{v}</div>
    </div>
  );
}
