import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import heroImg from './hero-illustration.png';

const SW = 1280;
const SH = 720;
const IMH = SW * (1024 / 1536);
const IMG_TOP = -30;

const INK = '#111111';
const ACCENT = '#6366F1';
const MUTED = '#6B7280';
const BORDER = '#E8E8EA';
const FONT = "var(--font-sans), 'Noto Sans KR', sans-serif";
const CTA_LABEL = '데모 요청하기';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

const Easing = {
  easeOutCubic: (t: number) => {
    const x = t - 1;
    return x * x * x + 1;
  },
};

const MOTION = {
  enter: (t: number) => Easing.easeOutCubic(clamp(t, 0, 1)),
  pop: (t: number) => Easing.easeOutCubic(clamp(t, 0, 1)),
};

type Cam = { x: number; y: number; s: number };
const STATIC_CAM: Cam = { x: 640, y: 360, s: 1 };

function clampCam(cam: Cam) {
  const hw = SW / 2 / cam.s;
  const hh = SH / 2 / cam.s;
  return {
    s: cam.s,
    x: clamp(cam.x, hw, SW - hw),
    y: clamp(cam.y, IMG_TOP + hh, IMG_TOP + IMH - hh),
  };
}

function Camera({ cam, children }: { cam: Cam; children?: ReactNode }) {
  const c = clampCam(cam);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#F4F4F6' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SW,
          height: SH,
          transformOrigin: '0 0',
          transform: `translate(${SW / 2 - c.s * c.x}px, ${SH / 2 - c.s * c.y}px) scale(${c.s})`,
        }}
      >
        <img
          src={heroImg}
          alt=""
          style={{ position: 'absolute', left: 0, top: IMG_TOP, width: SW, display: 'block' }}
        />
        {children}
      </div>
    </div>
  );
}

function Caption({ text, on }: { text: string; on: number }) {
  if (on <= 0) return null;
  const e = MOTION.enter(on);
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        top: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        padding: '10px 20px',
        boxShadow: '0 1px 2px rgba(17,17,17,0.05)',
        opacity: e,
        transform: `translateY(${(1 - e) * 12}px)`,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        color: INK,
      }}
    >
      <span style={{ color: ACCENT, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>&gt;</span>
      {text}
    </div>
  );
}

function Headline({ on, pulse = 0 }: { on: number; pulse?: number }) {
  if (on <= 0) return null;
  const e = MOTION.enter(on);
  const ps = 1 + 0.04 * Math.sin(Math.PI * pulse);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30,
        display: 'flex',
        justifyContent: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 18}px)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: '22px 36px 20px',
          boxShadow: '0 2px 8px rgba(17,17,17,0.06)',
          textAlign: 'center',
          maxWidth: 640,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            background: '#EEF2FF',
            color: ACCENT,
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          실시간 코드 리뷰 × AI 퀴즈
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: INK, marginTop: 10, letterSpacing: '-0.01em' }}>
          함께 리뷰하고, AI 퀴즈로 확인하세요
        </div>
        <div style={{ fontSize: 15, color: MUTED, marginTop: 8 }}>
          실시간 코드 리뷰 룸에서 함께 배우고, AI 퀴즈로 이해도를 측정합니다
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <div
            style={{
              background: INK,
              color: '#fff',
              borderRadius: 999,
              padding: '11px 24px',
              fontSize: 14,
              fontWeight: 600,
              transform: `scale(${ps})`,
            }}
          >
            {CTA_LABEL}
          </div>
          <div
            style={{
              background: '#fff',
              color: INK,
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: '11px 24px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            데모 보기
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizCard({ p }: { p: number }) {
  const pop = MOTION.pop(seg(p, 0.04, 0.18));
  if (pop <= 0) return null;
  const opts = [
    { label: 'O(n)', at: 0.24 },
    { label: 'O(n log n)', at: 0.32, correct: true },
    { label: 'O(n²)', at: 0.4 },
  ];
  const picked = seg(p, 0.55, 0.62) > 0;
  const done = MOTION.enter(seg(p, 0.74, 0.84));
  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        top: 78,
        width: 348,
        fontFamily: FONT,
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 4px 16px rgba(17,17,17,0.08)',
        opacity: pop,
        transform: `translateY(${(1 - pop) * 20}px) scale(${0.94 + 0.06 * pop})`,
        transformOrigin: '50% 20%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            background: '#EEF2FF',
            color: ACCENT,
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          AI 퀴즈
        </span>
        <div style={{ width: 110, height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(1 - p) * 100}%`, height: '100%', background: ACCENT, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 12, lineHeight: 1.45 }}>
        Q. 방금 리뷰한 정렬 함수의 시간 복잡도는?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {opts.map((o) => {
          const oe = MOTION.enter(seg(p, o.at, o.at + 0.1));
          const sel = Boolean(o.correct && picked);
          return (
            <div
              key={o.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                border: `1.5px solid ${sel ? ACCENT : BORDER}`,
                background: sel ? '#EEF2FF' : '#fff',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 600,
                color: INK,
                fontFamily: 'var(--font-mono)',
                opacity: oe,
                transform: `translateY(${(1 - oe) * 10}px)`,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  flex: 'none',
                  boxSizing: 'border-box',
                  border: `1.5px solid ${sel ? ACCENT : '#C9C9CE'}`,
                  background: sel ? ACCENT : '#fff',
                  boxShadow: sel ? 'inset 0 0 0 2.5px #EEF2FF' : 'none',
                }}
              />
              {o.label}
            </div>
          );
        })}
      </div>
      {done > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            padding: '8px 12px',
            background: '#ECF5F0',
            color: '#2F6E4F',
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 700,
            opacity: done,
            transform: `translateY(${(1 - done) * 8}px)`,
          }}
        >
          ✓ 정답입니다 · 이해도 92%
        </div>
      )}
    </div>
  );
}

type SceneClock = { progress: number; localTime: number; name: string };

const SceneCtx = createContext<SceneClock>({ progress: 0, localTime: 0, name: '' });
const useScene = () => useContext(SceneCtx);

const SCENES = [
  { name: '인트로', dur: 2 },
  { name: '실시간 리뷰', dur: 3 },
  { name: 'AI 퀴즈', dur: 2.5 },
  { name: '시작하기', dur: 2.5 },
] as const;

const TOTAL_DUR = SCENES.reduce((sum, s) => sum + s.dur, 0);

function SceneIntro() {
  return (
    <>
      <Camera cam={STATIC_CAM} />
      <Headline on={1} />
    </>
  );
}

function SceneReview() {
  const { progress: p } = useScene();
  const capOn = Math.min(seg(p, 0.06, 0.2), 1 - seg(p, 0.86, 0.96));
  return (
    <>
      <Camera cam={STATIC_CAM} />
      <Caption text="같은 코드를 보며 실시간으로 리뷰합니다" on={capOn} />
    </>
  );
}

function SceneQuiz() {
  const { progress: p } = useScene();
  const capOn = Math.min(seg(p, 0.05, 0.18), 1 - seg(p, 0.88, 0.97));
  return (
    <>
      <Camera cam={STATIC_CAM} />
      <QuizCard p={p} />
      <Caption text="리뷰한 내용, AI 퀴즈로 확인합니다" on={capOn} />
    </>
  );
}

function SceneCTA() {
  const { progress: p } = useScene();
  const on = seg(p, 0.08, 0.3);
  const pulse = seg(p, 0.55, 0.85);
  return (
    <>
      <Camera cam={STATIC_CAM} />
      <Headline on={on} pulse={pulse} />
    </>
  );
}

const SCENE_MAP: Record<string, () => ReactNode> = {
  인트로: SceneIntro,
  '실시간 리뷰': SceneReview,
  'AI 퀴즈': SceneQuiz,
  시작하기: SceneCTA,
};

/**
 * Port of design-handoff `hero-animation.jsx` for Vite/React.
 * Scene timing matches OM_SCENES from the marketing mockup.
 * Stage is authored at 1280×720 and scaled to fit the host frame.
 */
export function QurieHeroAnimation({ style }: { style?: CSSProperties }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (w <= 0 || h <= 0) return;
      setScale(Math.min(w / SW, h / SH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const tick = (now: number) => {
      const elapsed = ((now - start) / 1000) % TOTAL_DUR;
      setT(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const clock = useMemo(() => {
    let acc = 0;
    for (const scene of SCENES) {
      if (t < acc + scene.dur) {
        const localTime = t - acc;
        return {
          name: scene.name,
          localTime,
          progress: scene.dur > 0 ? localTime / scene.dur : 0,
        };
      }
      acc += scene.dur;
    }
    const last = SCENES[SCENES.length - 1];
    return { name: last.name, localTime: last.dur, progress: 1 };
  }, [t]);

  const Scene = SCENE_MAP[clock.name] ?? SceneIntro;

  return (
    <div
      ref={hostRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#FAFAFA',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: SW,
          height: SH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <SceneCtx.Provider value={clock}>
          <Scene />
        </SceneCtx.Provider>
      </div>
    </div>
  );
}
