import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Play, Star, Heart, Smile } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Joy Catcher - A Game of Smiles" },
      { name: "description", content: "A 3D game for kids that catches joy and builds confidence." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
  component: JoyCatcher,
});

const AFFIRMATIONS = [
  "You are so smart!",
  "You are a great helper!",
  "You are deeply loved!",
  "You are kind!",
  "You can do hard things!",
  "You bring joy!",
  "You are amazing!",
  "You are brave!",
];

const CONFETTI_COLORS = [
  "#ff3b8b", "#ffd93d", "#6bcB77", "#4d96ff", "#ff9f1c", "#c084fc", "#22d3ee",
];

function speakAffirmation(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.6;
    u.rate = 0.95;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /female|samantha|karen|google us english/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {}
}

function Character({ targetX }: { targetX: number }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.x += (targetX - group.current.position.x) * Math.min(1, dt * 6);
    const t = performance.now() / 400;
    group.current.position.y = Math.sin(t) * 0.08;
    if (body.current) body.current.rotation.y = Math.sin(t * 0.5) * 0.15;
  });
  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* body */}
      <mesh ref={body} position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.65, 0.7, 8, 24]} />
        <meshStandardMaterial color="#2dd4bf" roughness={0.4} />
      </mesh>
      {/* belly */}
      <mesh position={[0, 0.7, 0.55]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color="#ccfbf1" roughness={0.6} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.25, 1.15, 0.55]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.25, 1.15, 0.55]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.25, 1.17, 0.7]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.25, 1.17, 0.7]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* cheeks */}
      <mesh position={[-0.42, 0.95, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>
      <mesh position={[0.42, 0.95, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>
      {/* mouth */}
      <mesh position={[0, 0.92, 0.62]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.13, 0.04, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* feet */}
      <mesh position={[-0.3, 0.1, 0.2]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#0d9488" />
      </mesh>
      <mesh position={[0.3, 0.1, 0.2]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#0d9488" />
      </mesh>
    </group>
  );
}

type StarItem = { id: number; x: number; y: number; speed: number };

function JoyStar({ x, y }: { x: number; y: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 2;
  });
  return (
    <group ref={ref} position={[x, y, 0]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#fde047"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      <pointLight color="#fde047" intensity={1.2} distance={3} />
    </group>
  );
}

function Scene({
  charX,
  stars,
}: {
  charX: number;
  stars: StarItem[];
}) {
  return (
    <>
      <Sky sunPosition={[10, 8, 5]} turbidity={2} rayleigh={1} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 10, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>
      {/* hills */}
      <mesh position={[-4, 0.2, -3]} castShadow>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh position={[4.5, 0.2, -2]} castShadow>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} blur={2} scale={10} />
      <Character targetX={charX} />
      {stars.map((s) => (
        <JoyStar key={s.id} x={s.x} y={s.y} />
      ))}
    </>
  );
}

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
  const [charX, setCharX] = useState(0);
  const charXRef = useRef(0);
  const [stars, setStars] = useState<StarItem[]>([]);
  const starIdRef = useRef(0);
  const [score, setScore] = useState(0);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const confettiId = useRef(0);

  useEffect(() => {
    charXRef.current = charX;
  }, [charX]);

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
          speed: 1.2 + Math.random() * 0.6,
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
      setStars((prev) => {
        const next: StarItem[] = [];
        for (const s of prev) {
          const ny = s.y - s.speed * dt;
          // caught?
          if (ny < 1.2 && Math.abs(s.x - charXRef.current) < 0.8) {
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
    speakAffirmation(phrase);
    setScore((s) => s + 1);
    setPopup({ id: Date.now() + Math.random(), text: phrase });
    setTimeout(() => setPopup(null), 1800);
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
    setCharX(Math.max(-PLAY_BOUND, Math.min(PLAY_BOUND, x)));
  };

  const handlePlay = () => {
    // unlock audio
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    setStarted(true);
  };

  return (
    <div className="fixed inset-0 overflow-hidden select-none touch-none bg-sky-300">
      <div
        className="absolute inset-0"
        onPointerDown={handleTap}
        style={{ touchAction: "none" }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2.8, 7], fov: 55 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Scene charX={charX} stars={stars} />
          </Suspense>
        </Canvas>
      </div>

      {/* Score */}
      {started && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-lg pointer-events-none">
          <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          <span className="text-2xl font-black text-pink-600">{score}</span>
        </div>
      )}

      {/* Hearts indicator */}
      {started && (
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-full px-3 py-2 shadow-lg pointer-events-none">
          <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
        </div>
      )}

      {/* Tap hint arrows */}
      {started && score < 1 && (
        <>
          <div className="absolute left-4 bottom-1/3 text-white text-7xl font-black drop-shadow-lg animate-pulse pointer-events-none">
            ←
          </div>
          <div className="absolute right-4 bottom-1/3 text-white text-7xl font-black drop-shadow-lg animate-pulse pointer-events-none">
            →
          </div>
        </>
      )}

      {/* Affirmation popup */}
      {popup && (
        <div
          key={popup.id}
          className="absolute inset-x-0 top-1/4 flex justify-center pointer-events-none px-6"
        >
          <div className="affirm-pop bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-500 text-white text-4xl sm:text-6xl font-black px-8 py-6 rounded-3xl shadow-2xl text-center border-4 border-white">
            {popup.text}
          </div>
        </div>
      )}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="absolute left-1/2 top-2/3 pointer-events-none">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-400/70 to-indigo-500/70 backdrop-blur-sm">
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
