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

// Daniel palette from the character bible
const DANIEL = {
  skin: "#f5cfa8",
  cheek: "#f4a896",
  hair: "#3a2a21",
  brow: "#2a1a14",
  eyeWhite: "#ffffff",
  iris: "#5a3a22",
  pupil: "#0f0a08",
  hoodie: "#d97706",
  hoodieShade: "#b45309",
  drawstring: "#fffaf0",
  pants: "#1a1a1a",
  shoe: "#111111",
  shoeSole: "#ffffff",
  shoeStripe: "#dc2626",
};

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
    // Unlock on Android by attempting a silent play+pause inside the user gesture
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


// A stylized "Daniel" — 5yr boy, orange hoodie, black cargo joggers,
// black high-top sneakers, messy dark-brown hair, large brown eyes.
function Character({ targetX }: { targetX: number }) {
  const group = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.x += (targetX - group.current.position.x) * Math.min(1, dt * 6);
    const t = performance.now() / 400;
    group.current.position.y = Math.sin(t) * 0.06;
    if (torso.current) torso.current.rotation.y = Math.sin(t * 0.5) * 0.12;
  });

  // pre-computed messy hair tufts (deterministic)
  const tufts: Array<[number, number, number, number]> = [
    [0, 0.28, -0.05, 0.34],
    [-0.22, 0.22, 0.05, 0.26],
    [0.22, 0.22, 0.05, 0.26],
    [-0.12, 0.34, 0.12, 0.22],
    [0.12, 0.34, 0.12, 0.22],
    [-0.28, 0.05, -0.05, 0.24],
    [0.28, 0.05, -0.05, 0.24],
    [0, 0.18, 0.28, 0.22],
    [-0.18, 0.4, 0.0, 0.18],
    [0.2, 0.38, -0.1, 0.18],
  ];

  return (
    <group ref={group} position={[0, 0, 0]}>
      <group ref={torso}>
        {/* legs — black cargo joggers */}
        <mesh position={[-0.18, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.55, 16]} />
          <meshStandardMaterial color={DANIEL.pants} roughness={0.85} />
        </mesh>
        <mesh position={[0.18, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.55, 16]} />
          <meshStandardMaterial color={DANIEL.pants} roughness={0.85} />
        </mesh>

        {/* shoes — black high-tops with white sole + red stripe */}
        {[-0.18, 0.18].map((x) => (
          <group key={x} position={[x, 0.02, 0.06]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.18, 0.42]} />
              <meshStandardMaterial color={DANIEL.shoe} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <boxGeometry args={[0.28, 0.05, 0.44]} />
              <meshStandardMaterial color={DANIEL.shoeSole} />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.29, 0.015, 0.45]} />
              <meshStandardMaterial color={DANIEL.shoeStripe} />
            </mesh>
            <mesh position={[0, -0.06, 0.21]}>
              <boxGeometry args={[0.26, 0.08, 0.04]} />
              <meshStandardMaterial color={DANIEL.shoeSole} />
            </mesh>
          </group>
        ))}

        {/* hoodie torso */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.45, 8, 24]} />
          <meshStandardMaterial color={DANIEL.hoodie} roughness={0.75} />
        </mesh>
        {/* front pocket pouch */}
        <mesh position={[0, 0.62, 0.35]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.55, 0.22, 0.08]} />
          <meshStandardMaterial color={DANIEL.hoodieShade} roughness={0.85} />
        </mesh>
        {/* hood at back of neck */}
        <mesh position={[0, 1.18, -0.22]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color={DANIEL.hoodieShade} roughness={0.8} />
        </mesh>
        {/* drawstrings */}
        <mesh position={[-0.06, 1.05, 0.38]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
          <meshStandardMaterial color={DANIEL.drawstring} />
        </mesh>
        <mesh position={[0.06, 1.05, 0.38]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
          <meshStandardMaterial color={DANIEL.drawstring} />
        </mesh>

        {/* arms */}
        <mesh position={[-0.55, 0.85, 0]} rotation={[0, 0, 0.25]} castShadow>
          <capsuleGeometry args={[0.13, 0.45, 8, 16]} />
          <meshStandardMaterial color={DANIEL.hoodie} roughness={0.75} />
        </mesh>
        <mesh position={[0.55, 0.85, 0]} rotation={[0, 0, -0.25]} castShadow>
          <capsuleGeometry args={[0.13, 0.45, 8, 16]} />
          <meshStandardMaterial color={DANIEL.hoodie} roughness={0.75} />
        </mesh>
        {/* hands */}
        <mesh position={[-0.72, 0.5, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={DANIEL.skin} roughness={0.6} />
        </mesh>
        <mesh position={[0.72, 0.5, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={DANIEL.skin} roughness={0.6} />
        </mesh>

        {/* head */}
        <group position={[0, 1.55, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={DANIEL.skin} roughness={0.55} />
          </mesh>

          {/* hair cap */}
          <mesh position={[0, 0.18, -0.05]} rotation={[-0.1, 0, 0]}>
            <sphereGeometry args={[0.52, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={DANIEL.hair} roughness={0.9} />
          </mesh>
          {/* messy tufts */}
          {tufts.map(([x, y, z, s], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[0.2, i, 0.1 * i]}>
              <coneGeometry args={[s * 0.55, s * 1.1, 8]} />
              <meshStandardMaterial color={DANIEL.hair} roughness={0.9} />
            </mesh>
          ))}
          {/* side-swept fringe */}
          <mesh position={[-0.05, 0.22, 0.4]} rotation={[0.4, -0.3, 0.2]}>
            <coneGeometry args={[0.18, 0.4, 8]} />
            <meshStandardMaterial color={DANIEL.hair} roughness={0.9} />
          </mesh>

          {/* eyebrows */}
          <mesh position={[-0.18, 0.12, 0.42]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.16, 0.04, 0.04]} />
            <meshStandardMaterial color={DANIEL.brow} />
          </mesh>
          <mesh position={[0.18, 0.12, 0.42]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.16, 0.04, 0.04]} />
            <meshStandardMaterial color={DANIEL.brow} />
          </mesh>

          {/* large round eyes */}
          {[-0.17, 0.17].map((x) => (
            <group key={x} position={[x, 0, 0.4]}>
              <mesh>
                <sphereGeometry args={[0.13, 24, 24]} />
                <meshStandardMaterial color={DANIEL.eyeWhite} />
              </mesh>
              <mesh position={[0, -0.01, 0.08]}>
                <sphereGeometry args={[0.09, 20, 20]} />
                <meshStandardMaterial color={DANIEL.iris} />
              </mesh>
              <mesh position={[0, -0.01, 0.13]}>
                <sphereGeometry args={[0.055, 16, 16]} />
                <meshStandardMaterial color={DANIEL.pupil} />
              </mesh>
              <mesh position={[0.025, 0.03, 0.16]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}

          {/* button nose */}
          <mesh position={[0, -0.05, 0.48]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={DANIEL.skin} roughness={0.5} />
          </mesh>

          {/* rosy cheeks */}
          <mesh position={[-0.3, -0.1, 0.35]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={DANIEL.cheek} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.3, -0.1, 0.35]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={DANIEL.cheek} transparent opacity={0.6} />
          </mesh>

          {/* gentle smile */}
          <mesh position={[0, -0.2, 0.42]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.08, 0.018, 10, 20, Math.PI]} />
            <meshStandardMaterial color="#7a2a1a" />
          </mesh>
        </group>
      </group>
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
