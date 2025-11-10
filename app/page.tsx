'use client';

import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [trackUrl, setTrackUrl] = useState("");

  const questions = [
    "How's your energy level?",
    "What's your main emotion?",
    "Do you want to be alone or with others?"
  ];

  const options = [
    ["Low", "Medium", "High"],
    ["Happy", "Sad", "Angry", "Calm", "Excited"],
    ["Alone", "With friends", "Doesn't matter"]
  ];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const genre = decideGenre(newAnswers);
      const url = getTrackByGenre(genre);
      setTrackUrl(url);
    }
  };

  const decideGenre = (answers: string[]) => {
    const energy = answers[0];
    const emotion = answers[1];

    if (emotion === "Happy" && energy === "High") return "dance";
    if (emotion === "Sad") return "acoustic";
    if (emotion === "Angry") return "rock";
    if (energy === "Low") return "lofi";
    return "chill";
  };

  const getTrackByGenre = (genre: string) => {
    const tracks: Record<string, string> = {
      dance: "https://www.youtube.com/embed/OPf0YbXqDm0",
      acoustic: "https://www.youtube.com/embed/63ft2c3q1xA",
      rock: "https://www.youtube.com/embed/kXYiU_JCYtU",
      lofi: "https://www.youtube.com/embed/jfKfPfyJRdk",
      chill: "https://www.youtube.com/embed/5qap5aOQPac"
    };
    return tracks[genre] || tracks.chill;
  };

  const shareToFarcaster = () => {
    const text = `Just used Mooder to find the perfect track for my mood!\n\nTry it: ${window.location.origin}`;
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, "_blank");
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setTrackUrl("");
  };

  if (trackUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <h1 className="text-4xl font-bold mb-4">Your Perfect Track</h1>
        <iframe
          width="100%"
          height="300"
          src={trackUrl}
          allow="autoplay; encrypted-media"
          className="rounded-lg mb-6 max-w-md"
          title="Music player"
        />
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Try Again
          </button>
          <button
            onClick={shareToFarcaster}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Share on Farcaster
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <h1 className="text-5xl font-bold mb-2">Mooder</h1>
      <p className="text-xl mb-8 opacity-90">AI picks music for your mood</p>

      {step === 0 ? (
        <button
          onClick={() => setStep(1)}
          className="px-8 py-4 bg-white text-indigo-900 text-xl font-bold rounded-xl hover:bg-gray-100 transition transform hover:scale-105"
        >
          What's your mood?
        </button>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-lg mb-6 text-center">{questions[step - 1]}</p>
          <div className="grid grid-cols-1 gap-3">
            {options[step - 1].map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="px-6 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition border border-white/20"
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-sm mt-6 text-center opacity-70">
            Question {step} of {questions.length}
          </p>
        </div>
      )}
    </main>
  );
}