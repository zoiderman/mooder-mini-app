'use client';

import { Button } from "@minikit/ui";
import { useState } from "react";

interface Mood {
  emoji: string;
  label: string;
  genres: string[];
}

const moods: Mood[] = [
  { emoji: "smiling face", label: "Happy", genres: ["pop", "dance"] },
  { emoji: "crying face", label: "Sad", genres: ["acoustic", "blues"] },
  { emoji: "angry face", label: "Angry", genres: ["rock", "metal"] },
  { emoji: "sunglasses", label: "Chill", genres: ["lofi", "jazz"] },
  { emoji: "exploding head", label: "Energetic", genres: ["edm", "hip-hop"] }
];

const questions: string[] = [
  "How's your energy level?",
  "What's your main emotion?",
  "Do you want to be alone or with others?"
];

const options: string[][] = [
  ["Low", "Medium", "High"],
  ["Happy", "Sad", "Angry", "Calm", "Excited"],
  ["Alone", "With friends", "Doesn't matter"]
];

export default function Home() {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [trackUrl, setTrackUrl] = useState<string>("");

  const handleAnswer = (answer: string): void => {
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

  const decideGenre = (answers: string[]): string => {
    const energy = answers[0];
    const emotion = answers[1];

    if (emotion === "Happy" && energy === "High") return "dance";
    if (emotion === "Sad") return "acoustic";
    if (emotion === "Angry") return "rock";
    if (energy === "Low") return "lofi";
    return "chill";
  };

  const getTrackByGenre = (genre: string): string => {
    const tracks: Record<string, string> = {
      pop: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      dance: "https://www.youtube.com/embed/OPf0YbXqDm0",
      acoustic: "https://www.youtube.com/embed/63ft2c3q1xA",
      lofi: "https://www.youtube.com/embed/jfKfPfyJRdk",
      rock: "https://www.youtube.com/embed/kXYiU_JCYtU",
      chill: "https://www.youtube.com/embed/5qap5aOQPac"
    };
    return tracks[genre] || tracks.chill;
  };

  const shareToFarcaster = (): void => {
    const text = `Just used @Mooder to find the perfect track for my mood!\n\nTry it: ${window.location.origin}`;
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, "_blank");
  };

  const reset = (): void => {
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
          <Button onClick={reset}>Try Again</Button>
          <Button onClick={shareToFarcaster} variant="secondary">
            Share on Farcaster
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <h1 className="text-5xl font-bold mb-2">Mooder</h1>
      <p className="text-xl mb-8 opacity-90">AI picks music for your mood</p>

      {step === 0 ? (
        <Button size="lg" onClick={() => setStep(1)}>
          What's your mood?
        </Button>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-lg mb-6 text-center">{questions[step - 1]}</p>
          <div className="grid grid-cols-1 gap-3">
            {options[step - 1].map((opt: string) => (
              <Button
                key={opt}
                variant="outline"
                onClick={() => handleAnswer(opt)}
                className="text-lg py-6"
              >
                {opt}
              </Button>
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