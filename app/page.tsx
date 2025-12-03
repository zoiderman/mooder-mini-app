// app/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-white text-2xl">
        Завантаження...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white px-6">
      <h1 className="text-6xl font-bold mb-8">Mooder</h1>
      <p className="text-xl mb-12 text-center">
        AI підбирає музику під твій настрій.
      </p>

      {session ? (
        <div className="text-center">
          <p className="text-2xl mb-8">Привіт, {session.user?.name}!</p>
          <a
            href="/quiz"
            className="inline-block px-12 py-6 bg-white text-purple-900 rounded-full text-2xl font-bold hover:bg-gray-100 transition"
          >
            Почати
          </a>
        </div>
      ) : (
        <button
          onClick={() => signIn("spotify")}
          className="px-16 py-6 bg-green-500 hover:bg-green-600 rounded-full text-2xl font-bold flex items-center gap-3"
        >
          Увійти через Spotify
        </button>
      )}
    </main>
  );
}
