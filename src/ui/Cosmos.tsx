import { type CSSProperties, useEffect, useMemo, useRef } from "react";

/** Seeded generator so the sky looks the same on every render and reload. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_TINTS = ["#ffffff", "#ffffff", "#ffe2d6", "#ffc9b8", "#ffe9c4", "#dfe4ff"];

interface Star {
  x: number;
  y: number;
  r: number;
  fill: string;
  twinkle: boolean;
}

function makeStars(count: number): Star[] {
  const random = seededRandom(1977);
  return Array.from({ length: count }, (_, index) => {
    const bright = random() < 0.06;
    return {
      x: random() * 1600,
      y: random() * 1000,
      r: bright ? 1.1 + random() * 0.9 : 0.3 + random() * 0.6,
      fill: STAR_TINTS[Math.floor(random() * STAR_TINTS.length)],
      twinkle: bright && index % 2 === 0,
    };
  });
}

interface Mote {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

interface GalaxyShape {
  /** Stars and glow along the spiral arms. */
  arms: Mote[];
  /** Dark dust trailing the inner edge of each arm. */
  dust: Mote[];
  /** Pink star-forming knots dotted along the outer arms. */
  knots: Mote[];
  /** Faint old stars filling the disk between the arms. */
  disk: Mote[];
}

/** Roughly normal noise, so points cluster along the arm instead of in a band. */
function gaussian(random: () => number): number {
  return (random() + random() + random() - 1.5) / 1.5;
}

function makeGalaxy(seed: number, detail: number): GalaxyShape {
  const random = seededRandom(seed);
  const shape: GalaxyShape = { arms: [], dust: [], knots: [], disk: [] };
  const turns = Math.PI * 3.4;
  // Logarithmic spiral: the radius grows exponentially with the angle.
  const radiusAt = (t: number) => 7 * Math.exp(t * Math.log(104 / 7));
  const point = (t: number, offsetAngle: number, spread: number) => {
    const angle = t * turns + offsetAngle;
    const radius = radiusAt(t) + gaussian(random) * spread;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  for (let arm = 0; arm < 2; arm++) {
    const base = arm * Math.PI;
    for (let i = 0; i < 1100 * detail; i++) {
      const t = random() ** 0.85;
      const fade = 1 - t * 0.55;
      shape.arms.push({
        ...point(t, base + gaussian(random) * 0.12, 2 + t * 9),
        r: 0.3 + random() * 1.1 * fade,
        opacity: 0.3 + random() * 0.6 * fade,
      });
    }
    for (let i = 0; i < 260 * detail; i++) {
      const t = 0.12 + random() * 0.7;
      shape.dust.push({
        ...point(t, base - 0.32, 1.5 + t * 4),
        r: 2 + random() * 3,
        opacity: 0.25 + random() * 0.3,
      });
    }
    for (let i = 0; i < 24 * detail; i++) {
      const t = 0.35 + random() * 0.6;
      shape.knots.push({
        ...point(t, base + 0.08, 2 + t * 6),
        r: 0.6 + random() * 0.9,
        opacity: 0.5 + random() * 0.4,
      });
    }
  }

  for (let i = 0; i < 600 * detail; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.min(110, -Math.log(1 - random()) * 26);
    shape.disk.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      r: 0.25 + random() * 0.45,
      opacity: 0.2 + random() * 0.45,
    });
  }
  return shape;
}

function Motes({ motes, scale = 1, fade = 1 }: { motes: Mote[]; scale?: number; fade?: number }) {
  return motes.map((mote, index) => (
    <circle key={index} cx={mote.x} cy={mote.y} r={mote.r * scale} opacity={mote.opacity * fade} />
  ));
}

/**
 * A spiral galaxy seen at an angle. The outer element sets position and
 * angle; the disk is flattened by the tilt and spins in its own plane, while
 * the bulge stays rounder and a fixed dust lane crosses in front of it.
 */
function Galaxy({ id, seed, detail, className }: { id: string; seed: number; detail: number; className: string }) {
  const shape = useMemo(() => makeGalaxy(seed, detail), [seed, detail]);
  // Colors follow distance from the core: golden center, pink arms, blue rim.
  const radial = (name: string, stops: [number, string, number][]) => (
    <radialGradient id={`${id}-${name}`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="112">
      {stops.map(([offset, color, opacity]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </radialGradient>
  );
  return (
    <div className={`galaxy ${className}`}>
      <div className="galaxy-plane">
        <svg className="galaxy-spin" viewBox="-120 -120 240 240">
          <defs>
            {radial("glow", [
              [0, "#ffe2b8", 0.75],
              [0.2, "#e9a07e", 0.38],
              [0.5, "#a8506e", 0.16],
              [0.8, "#4c3a8a", 0.08],
              [1, "#2a1a50", 0],
            ])}
            {radial("starlight", [
              [0, "#fff2d8", 1],
              [0.3, "#ffd9cf", 1],
              [0.45, "#f3d6ea", 1],
              [0.75, "#c9d6ff", 1],
              [1, "#a9c0ff", 1],
            ])}
            {radial("cloud", [
              [0, "#ffd6a8", 1],
              [0.35, "#f2a6b8", 1],
              [0.55, "#b9a6f0", 1],
              [0.8, "#8fb0ff", 1],
              [1, "#7aa0ff", 1],
            ])}
            <filter id={`${id}-haze`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
            <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <filter id={`${id}-knot`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
          </defs>
          <circle r="118" fill={`url(#${id}-glow)`} />
          <g fill={`url(#${id}-cloud)`} filter={`url(#${id}-haze)`}>
            <Motes motes={shape.arms} scale={3.6} fade={0.24} />
          </g>
          <g fill="#140610" filter={`url(#${id}-soft)`}>
            <Motes motes={shape.dust} />
          </g>
          <g fill={`url(#${id}-starlight)`}>
            <Motes motes={shape.disk} />
          </g>
          <g fill={`url(#${id}-starlight)`}>
            <Motes motes={shape.arms} scale={0.32} fade={0.95} />
          </g>
          <g fill="#ff7fa8" filter={`url(#${id}-knot)`}>
            <Motes motes={shape.knots} />
          </g>
        </svg>
      </div>
      <svg className="galaxy-bulge" viewBox="-120 -120 240 240">
        <defs>
          <radialGradient id={`${id}-bulge`}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.12" stopColor="#fff3dc" stopOpacity="0.95" />
            <stop offset="0.4" stopColor="#f8cf8e" stopOpacity="0.45" />
            <stop offset="0.75" stopColor="#e0905e" stopOpacity="0.12" />
            <stop offset="1" stopColor="#c06048" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="36" fill={`url(#${id}-bulge)`} />
      </svg>
      {/* The near side of the disk stays toward the viewer, so its dust does not spin. */}
      <div className="galaxy-plane">
        <svg className="galaxy-lane" viewBox="-120 -120 240 240">
          <defs>
            <filter id={`${id}-lane`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          <g fill="none" stroke="#12050d" strokeLinecap="round" filter={`url(#${id}-lane)`}>
            <path d="M -24 3 A 24 24 0 0 0 24 3" strokeWidth="5" opacity="0.85" />
            <path d="M -46 6 A 46 46 0 0 0 46 6" strokeWidth="4" opacity="0.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/** Bright stars in front of everything, with the spikes a telescope adds. */
const FOREGROUND_STARS = [
  { x: 1180, y: 420, size: 1 },
  { x: 260, y: 160, size: 0.7 },
  { x: 1420, y: 120, size: 0.6 },
  { x: 980, y: 860, size: 0.8 },
  { x: 140, y: 620, size: 0.55 },
];

function ForegroundStars() {
  return (
    <svg className="starfield" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="flare">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.2" stopColor="#ffeede" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffb0a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="spike" x1="0" x2="1">
          <stop offset="0" stopColor="#ffe6dc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe6dc" stopOpacity="0" />
        </linearGradient>
      </defs>
      {FOREGROUND_STARS.map((star) => (
        <g key={`${star.x}-${star.y}`} transform={`translate(${star.x} ${star.y}) scale(${star.size})`}>
          <circle r="9" fill="url(#flare)" />
          <rect x="-26" y="-0.6" width="52" height="1.2" fill="url(#spike)" />
          <rect x="-26" y="-0.6" width="52" height="1.2" fill="url(#spike)" transform="rotate(90)" />
          <circle r="1.6" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

function Stars({ stars }: { stars: Star[] }) {
  return (
    <svg className="starfield" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      {stars.map((star, index) => (
        <circle
          key={index}
          className={star.twinkle ? "twinkle" : undefined}
          style={star.twinkle ? { animationDelay: `${(index % 9) * 0.7}s` } : undefined}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill={star.fill}
        />
      ))}
    </svg>
  );
}

/** How far, in pixels, a layer drifts when the pointer reaches the window edge. */
function depth(pixels: number): CSSProperties {
  return { "--depth": `${pixels}px` } as CSSProperties;
}

/**
 * Track the mouse as -1..1 offsets from the window center, so nearer layers
 * drift further than distant ones. Touch input and reduced motion skip it.
 */
function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame = 0;
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        ref.current?.style.setProperty("--px", x.toFixed(3));
        ref.current?.style.setProperty("--py", y.toFixed(3));
      });
    }
    window.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return ref;
}

/** The fixed deep-space backdrop behind every screen. */
export function Cosmos() {
  const stars = useMemo(() => makeStars(420), []);
  const distantStars = stars.filter((star) => star.r < 1);
  const nearStars = stars.filter((star) => star.r >= 1);
  const ref = useParallax();
  return (
    <div className="cosmos" aria-hidden="true" ref={ref}>
      <div className="layer" style={depth(3)}>
        <div className="nebula" />
      </div>
      <div className="layer" style={depth(6)}>
        <Stars stars={distantStars} />
      </div>
      <div className="layer" style={depth(10)}>
        <Galaxy id="distant" seed={7} detail={0.5} className="galaxy-far" />
      </div>
      <div className="layer" style={depth(14)}>
        <Stars stars={nearStars} />
      </div>
      <div className="layer" style={depth(22)}>
        <Galaxy id="andromeda" seed={42} detail={1} className="galaxy-near" />
      </div>
      <div className="layer" style={depth(30)}>
        <ForegroundStars />
      </div>
    </div>
  );
}
