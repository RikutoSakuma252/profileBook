import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-softPink">
          ダマテンラジオ
          <br />
          プロフィール帳
        </h1>
        <p className="text-lg text-gray-600">
          社内メンバーの知られざる一面を、プロフィール帳で覗いてみよう
        </p>
        <Link
          href="/profiles"
          className="inline-block px-8 py-4 bg-softPink text-white rounded-full font-bold shadow-lg hover:bg-salmon transition-colors"
        >
          みんなのプロフィールを見る
        </Link>
      </div>
    </main>
  );
}
