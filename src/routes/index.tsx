import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Star, Heart, Smile } from "lucide-react";

import bgSky from "@/assets/images/bg-sky.png";
import bgHills from "@/assets/images/bg-hills.png";
import bgGround from "@/assets/images/bg-ground.png";
import danielIdle from "@/assets/images/daniel-idle.png";
import danielRun from "@/assets/images/daniel-run.png";
import danielCatch from "@/assets/images/daniel-catch.png";
import danielCheer from "@/assets/images/daniel-cheer.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Joy Catcher - A Game of Smiles" },
      { name: "description", content: "A 2D game for kids that catches joy and builds confidence." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
  component: JoyCatcher,
});

import smartAsset from "@/assets/affirmations/you-are-so-smart.mp3.asset.json";
import helperAsset from "@/assets/affirmations/you-are-a-great-helper.mp3.asset.json";
import lovedAsset from "@/assets/affirmations/you-are-deeply-loved.mp3.asset.json";
import kindAsset from "@/assets/affirmations/you-are-kind.mp3.asset.json";
import hardAsset from "@/assets/affirmations/you-can-do-hard-things.mp3.asset.json";
import joyAsset from "@/assets/affirmations/you-bring-joy.mp3.asset.json";
import amazingAsset from "@/assets/affirmations/you-are-amazing.mp3.asset.json";
import braveAsset from "@/assets/affirmations/you-are-brave.mp3.asset.json";

const AFFIRMATIONS: { text: string; url: string }[] = [
  { text: "You are so smart!", url: smartAsset.url },
  { text: "You are a great helper!", url: helperAsset.url },
  { text: "You are deeply loved!", url: lovedAsset.url },
  { text: "You are kind!", url: kindAsset.url },
  { text: "You can do hard things!", url: hardAsset.url },
  { text: "You bring joy!", url: joyAsset.url },
  { text: "You are amazing!", url: amazingAsset.url },
  { text: "You are brave!", url: braveAsset.url },
];

const CONFETTI_COLORS = [
  "#ff3b8b", "#ffd93d", "#6bcB77", "#4d96ff", "#ff9f1c", "#c084fc", "#22d3ee",
];

// Pre-warmed Audio pool for instant playback (no TTS latency)
const audioCache = new Map<string, HTMLAudioElement>();
function getAudio(url: string): HTMLAudioElement {
  let a = audioCache.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = "auto";
    audioCache.set(url, a);
  }
  return a;
}
function primeAudio() {
  if (typeof window === "undefined") return;
  AFFIRMATIONS.forEach((a) => {
    const el = getAudio(a.url);
    el.muted = true;
    el.play().then(() => { el.pause(); el.currentTime = 0; el.muted = false; }).catch(() => { el.muted = false; });
  });
}
function speakAffirmation(url: string) {
  try {
    const el = getAudio(url);
    el.currentTime = 0;
    el.volume = 1;
    void el.play().catch(() => {});
  } catch {}
}

function useTransparentImage(src: string, threshold = 240): string {
  const [processedSrc, setProcessedSrc] = useState<string>(src);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      const isWhite = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return r > threshold && g > threshold && b > threshold;
      };

      const push = (x: number, y: number) => {
        const idx = y * w + x;
        if (!visited[idx] && isWhite(x, y)) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      };

      for (let x = 0; x < w; x++) {
        push(x, 0);
        push(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        push(0, y);
        push(w - 1, y);
      }

      let qIdx = 0;
      while (qIdx < queue.length) {
        const cx = queue[qIdx++];
        const cy = queue[qIdx++];

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nidx = ny * w + nx;
            if (!visited[nidx] && isWhite(nx, ny)) {
              visited[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      for (let i = 0; i < w * h; i++) {
        if (visited[i]) {
          data[i * 4 + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolveImageFringes(canvas, ctx, imgData, visited);
      if (isMounted) {
        setProcessedSrc(canvas.toDataURL());
      }
    };
    img.src = src;
    
    return () => {
      isMounted = false;
    };
  }, [src, threshold]);

  return processedSrc;
}

// Helper to smooth out rough white edges from chroma-keying
function resolveImageFringes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, imgData: ImageData, visited: Uint8Array) {
  const w = canvas.width;
  const h = canvas.height;
  const data = imgData.data;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (!visited[idx]) {
        const neighbors = [
          (y - 1) * w + x,
          (y + 1) * w + x,
          y * w + (x - 1),
          y * w + (x + 1)
        ];
        let transparentCount = 0;
        for (const n of neighbors) {
          if (visited[n]) transparentCount++;
        }
        if (transparentCount > 0) {
          const pixelIdx = idx * 4;
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          if (r > 200 && g > 200 && b > 200) {
            data[pixelIdx + 3] = Math.max(0, data[pixelIdx + 3] - (transparentCount * 60));
          }
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

type StarItem = { id: number; x: number; y: number; speed: number };

interface Confetti {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  rot: number;
}

const PLAY_BOUND = 3.2;

function JoyCatcher() {
  const [started, setStarted] = useState(false);
  const [targetX, setTargetX] = useState(0);
  const [visualX, setVisualX] = useState(0);
  const visualXRef = useRef(0);
  const targetXRef = useRef(0);
  
  const [stars, setStars] = useState<StarItem[]>([]);
  const starIdRef = useRef(0);
  const [score, setScore] = useState(0);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const confettiId = useRef(0);

  // Animation states
  const [actionState, setActionState] = useState<'none' | 'catch' | 'cheer'>('none');
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process white backgrounds dynamically in-browser
  const transparentIdle = useTransparentImage(danielIdle);
  const transparentRun = useTransparentImage(danielRun);
  const transparentCatch = useTransparentImage(danielCatch);
  const transparentCheer = useTransparentImage(danielCheer);
  const transparentHills = useTransparentImage(bgHills, 245);
  const transparentGround = useTransparentImage(bgGround, 245);

  useEffect(() => {
    targetXRef.current = targetX;
  }, [targetX]);

  // Preload voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Spawn stars
  useEffect(() => {
    if (!started) return;
    const i = setInterval(() => {
      setStars((prev) => [
        ...prev,
        {
          id: ++starIdRef.current,
          x: (Math.random() - 0.5) * 2 * PLAY_BOUND,
          y: 8,
          speed: 1.5 + Math.random() * 0.8,
        },
      ]);
    }, 1400);
    return () => clearInterval(i);
  }, [started]);

  // Game loop
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Interpolate character position
      setVisualX((prev) => {
        const next = prev + (targetXRef.current - prev) * Math.min(1, dt * 6);
        visualXRef.current = next;
        return next;
      });

      setStars((prev) => {
        const next: StarItem[] = [];
        for (const s of prev) {
          const ny = s.y - s.speed * dt;
          // caught?
          if (ny < 1.2 && Math.abs(s.x - visualXRef.current) < 0.8) {
            onCatch();
            continue;
          }
          if (ny < -1) continue;
          next.push({ ...s, y: ny });
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const onCatch = () => {
    const phrase = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    speakAffirmation(phrase.url);
    setScore((s) => s + 1);
    setPopup({ id: Date.now() + Math.random(), text: phrase.text });
    setTimeout(() => setPopup(null), 1800);

    // Trigger catch & cheer sprites sequence
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    setActionState('catch');
    
    actionTimeoutRef.current = setTimeout(() => {
      setActionState('cheer');
      actionTimeoutRef.current = setTimeout(() => {
        setActionState('none');
      }, 1000);
    }, 400); // Wait 400ms in catch pose, then cheer, then reset

    // confetti burst
    const burst: Confetti[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.3;
      const speed = 200 + Math.random() * 280;
      burst.push({
        id: ++confettiId.current,
        x: 0,
        y: 0,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
      });
    }
    setConfetti((c) => [...c, ...burst]);
    setTimeout(() => {
      setConfetti((c) => c.filter((p) => !burst.find((b) => b.id === p.id)));
    }, 1400);
  };

  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!started) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width; // 0..1
    const x = (ratio - 0.5) * 2 * PLAY_BOUND;
    setTargetX(Math.max(-PLAY_BOUND, Math.min(PLAY_BOUND, x)));
  };

  const handlePlay = () => {
    primeAudio();
    setStarted(true);
  };

  // Determine current active sprite and flip state
  let currentSprite = transparentIdle;
  let isFlipped = false;

  const isMoving = Math.abs(targetX - visualX) > 0.05;

  if (actionState === 'catch') {
    currentSprite = transparentCatch;
  } else if (actionState === 'cheer') {
    currentSprite = transparentCheer;
  } else if (isMoving) {
    currentSprite = transparentRun;
    isFlipped = targetX < visualX; // Face left if moving left
  }

  // Convert standard X coordinates [-3.2, 3.2] and Y coordinates [-1, 8] to viewport %
  const getXPercent = (x: number) => ((x - (-3.2)) / 6.4) * 100;
  const getYPercent = (y: number) => ((y - (-1)) / 9) * 100;

  return (
    <div className="fixed inset-0 overflow-hidden select-none touch-none bg-sky-300">
      <div
        className="absolute inset-0 game-viewport"
        onPointerDown={handleTap}
        style={{ touchAction: "none" }}
      >
        {/* Parallax Background */}
        <div 
          className="parallax-layer parallax-sky"
          style={{ 
            backgroundImage: `url(${bgSky})`,
            transform: `translateX(${-visualX * 6}px)` 
          }}
        />
        <div 
          className="parallax-layer parallax-hills"
          style={{ 
            backgroundImage: `url(${transparentHills})`,
            transform: `translateX(${-visualX * 24}px)` 
          }}
        />
        <div 
          className="parallax-layer parallax-ground"
          style={{ 
            backgroundImage: `url(${transparentGround})`,
            transform: `translateX(${-visualX * 45}px)` 
          }}
        />

        {/* 2D Daniel Sprite */}
        {started && (
          <div 
            className="character-sprite-container"
            style={{
              left: `${getXPercent(visualX)}%`,
              bottom: `12%`, // Standing on grass platform
            }}
          >
            <img 
              src={currentSprite} 
              alt="Daniel"
              className="character-sprite"
              style={{
                transform: isFlipped ? "scaleX(-1)" : "scaleX(1)",
              }}
            />
          </div>
        )}

        {/* 2D Stars falling */}
        {started && stars.map((s) => (
          <div
            key={s.id}
            className="star-2d"
            style={{
              left: `${getXPercent(s.x)}%`,
              bottom: `${getYPercent(s.y)}%`,
            }}
          >
            <svg viewBox="0 0 24 24" className="star-svg">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Score */}
      {started && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-lg pointer-events-none z-20">
          <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          <span className="text-2xl font-black text-pink-600">{score}</span>
        </div>
      )}

      {/* Hearts indicator */}
      {started && (
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-full px-3 py-2 shadow-lg pointer-events-none z-20">
          <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
        </div>
      )}

      {/* Tap hint arrows */}
      {started && score < 1 && (
        <>
          <div className="absolute left-4 bottom-1/3 text-white text-7xl font-black drop-shadow-lg animate-pulse pointer-events-none z-20">
            ←
          </div>
          <div className="absolute right-4 bottom-1/3 text-white text-7xl font-black drop-shadow-lg animate-pulse pointer-events-none z-20">
            →
          </div>
        </>
      )}

      {/* Affirmation popup */}
      {popup && (
        <div
          key={popup.id}
          className="absolute inset-x-0 top-1/4 flex justify-center pointer-events-none px-6 z-30"
        >
          <div className="affirm-pop bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-500 text-white text-4xl sm:text-6xl font-black px-8 py-6 rounded-3xl shadow-2xl text-center border-4 border-white">
            {popup.text}
          </div>
        </div>
      )}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="absolute left-1/2 top-2/3 pointer-events-none z-20">
          {confetti.map((p) => (
            <span
              key={p.id}
              className="confetti-piece"
              style={
                {
                  background: p.color,
                  ["--dx" as string]: `${p.dx}px`,
                  ["--dy" as string]: `${p.dy}px`,
                  ["--rot" as string]: `${p.rot}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-400/70 to-indigo-500/70 backdrop-blur-sm z-30">
          <div className="flex items-center gap-3 mb-6">
            <Smile className="w-14 h-14 text-yellow-300 fill-yellow-300" />
            <h1 className="text-5xl sm:text-7xl font-black text-white drop-shadow-lg">
              Joy Catcher
            </h1>
            <Star className="w-14 h-14 text-yellow-300 fill-yellow-300" />
          </div>
          <button
            onClick={handlePlay}
            className="play-btn relative w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl border-8 border-white flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Play"
          >
            <Play className="w-32 h-32 sm:w-40 sm:h-40 text-white fill-white ml-4" />
          </button>
          <p className="mt-8 text-white/90 text-xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 fill-pink-300 text-pink-300" />
            Tap to start
            <Heart className="w-6 h-6 fill-pink-300 text-pink-300" />
          </p>
        </div>
      )}
    </div>
  );
}

