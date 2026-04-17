import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-sm border-b border-peach/40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">📻</span>
          <span className="font-bold text-softPink group-hover:text-salmon transition-colors">
            ダマテンラジオ プロフィール帳
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/profiles" className="text-gray-600 hover:text-softPink transition-colors">
            一覧
          </Link>
        </nav>
      </div>
    </header>
  );
}
