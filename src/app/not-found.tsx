import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center text-center">
      <div>
        <h1 className="font-display text-6xl text-gold">404</h1>
        <p className="mt-2 text-sm text-text-2">Страница не найдена</p>
        <Link href="/" className="btn mt-6">
          На главную
        </Link>
      </div>
    </div>
  );
}
