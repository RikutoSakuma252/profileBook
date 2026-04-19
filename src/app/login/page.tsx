import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = {
  title: "チェックイン / ダマテンラジオ プロフィール帳",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const session = await auth();
  if (session) redirect(callbackUrl ?? "/");

  const domainRejected = error === "domain";
  const accessDenied = error === "AccessDenied";

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute left-0 top-1/3 h-px w-full bg-gradient-to-r from-transparent via-neon/25 to-transparent" />
        <div className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full border border-rose/25 animate-dial" />
        <div className="absolute right-[10%] bottom-[14%] h-28 w-28 rounded-full border border-neon/20" />
      </div>

      <div className="grid w-full gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        {/* ── LEFT: copy ── */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 font-typewriter text-[11px] uppercase tracking-[0.3em] text-neon/80">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-blink" />
            Studio Checkpoint / 入室確認
          </div>

          <h1 className="font-dot text-5xl leading-[0.95] tracking-tight text-paper sm:text-6xl">
            <span className="block text-rose-dusty">ダマテン</span>
            <span className="block">
              <span className="text-neon">ゲスト</span>
              <span className="text-paper/40"> · </span>
              <span>受付</span>
            </span>
          </h1>

          <p className="mt-6 max-w-md font-handwritten text-base leading-relaxed text-paper/80">
            ブースの扉は社内メンバー
            <span className="relative mx-1 inline-block">
              <span className="relative z-10 text-ink">　@e3sys.co.jp　</span>
              <span className="absolute inset-0 -z-0 bg-neon" />
            </span>
            の Google アカウントのみに開かれます。合言葉は、要りません。
          </p>

          <div className="mt-8 space-y-2 font-typewriter text-[11px] uppercase tracking-[0.2em] text-paper/40">
            <div>· 認証: Google OAuth 2.0</div>
            <div>· 権限: viewer (初回) → admin (管理者が昇格)</div>
            <div>· 記録: users テーブルに登録</div>
          </div>
        </div>

        {/* ── RIGHT: card ── */}
        <div className="relative">
          <div className="relative rotate-[-0.8deg]">
            <span className="tape left-10 -top-3 rotate-[-4deg]" aria-hidden />
            <span className="tape right-8 -bottom-3 rotate-[5deg]" aria-hidden />

            <div className="paper-grain relative overflow-hidden rounded-sm p-8 text-ink shadow-card">
              <header className="mb-4 flex items-center justify-between border-b border-dashed border-ink/30 pb-3">
                <div className="flex items-center gap-2 font-dot text-[11px] tracking-[0.2em]">
                  <span className="inline-block h-2 w-2 bg-rouge" />
                  GUEST PASS / FM 93.5
                </div>
                <div className="font-typewriter text-[11px] uppercase tracking-[0.2em] text-ink/60">
                  form A-001
                </div>
              </header>

              <div className="space-y-1 font-handwritten text-[15px]">
                <div className="flex justify-between">
                  <span className="text-ink/60">name</span>
                  <span className="text-ink/90">______________________</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">domain</span>
                  <span className="rounded-sm bg-ink px-2 py-0.5 font-dot text-[11px] tracking-[0.2em] text-neon">
                    @e3sys.co.jp
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">role</span>
                  <span className="font-dot text-[11px] tracking-[0.2em] text-ink/70">
                    VIEWER (初期)
                  </span>
                </div>
              </div>

              <div className="my-5 dotted-divider text-ink/40" />

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: callbackUrl ?? "/" });
                }}
              >
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between gap-3 rounded-sm bg-ink px-5 py-3.5 font-dot text-sm tracking-[0.2em] text-paper transition-transform hover:-translate-y-0.5 hover:bg-ink-deep"
                >
                  <span className="flex items-center gap-3">
                    <GoogleMark />
                    Google でチェックイン
                  </span>
                  <span className="text-neon transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </form>

              {(domainRejected || accessDenied) && (
                <div className="mt-5 flex items-center gap-3 border-2 border-dashed border-rouge/60 p-3 text-rouge">
                  <span className="stamp-rouge text-xs">REJECTED</span>
                  <p className="font-handwritten text-sm leading-snug text-rouge">
                    {domainRejected
                      ? "社外ドメインのアカウントでは入室できません。@e3sys.co.jp でお試しください。"
                      : "認証に失敗しました。もう一度お試しください。"}
                  </p>
                </div>
              )}

              <footer className="mt-6 flex items-center justify-between border-t border-dotted border-ink/30 pt-3">
                <Link
                  href="/"
                  className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-rouge"
                >
                  ← back to lobby
                </Link>
                <span className="font-dot text-[11px] tracking-[0.2em] text-rouge">
                  取扱注意
                </span>
              </footer>
            </div>

            <div className="absolute -bottom-4 -right-4 rotate-[8deg] rounded-full bg-neon px-3 py-1 font-dot text-[10px] tracking-[0.25em] text-ink shadow-neon">
              ON AIR ONLY
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="h-5 w-5"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.1 0 9.8-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l.0 .0 6.2 5.2C37.5 42.2 44 36 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
