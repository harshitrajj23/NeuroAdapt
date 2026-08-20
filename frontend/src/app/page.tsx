'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE NEURAL PARTICLE SYSTEM
   - Mouse attraction (particles gravitate toward cursor)
   - Click ripple waves push particles outward
   - Connection lines brighten near cursor
   - Touch support for mobile
   ═══════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  hue: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  max: number;
  a: number;
}

function useParticles(ref: React.RefObject<HTMLCanvasElement | null>) {
  const mouse = useRef({ x: -999, y: -999 });
  const pts = useRef<Particle[]>([]);
  const rips = useRef<Ripple[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w;
      c.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    const n = Math.min(Math.floor((w * h) / 14000), 75);
    pts.current = Array.from({ length: n }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, ox: x, oy: y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.5 + 0.8,
        a: Math.random() * 0.5 + 0.15,
        hue: 255 + Math.random() * 40,
      };
    });

    const onMM = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onTM = (e: TouchEvent) => { if (e.touches[0]) mouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onML = () => { mouse.current = { x: -999, y: -999 }; };
    const onClick = (e: MouseEvent) => {
      rips.current.push({ x: e.clientX, y: e.clientY, r: 0, max: 280, a: 0.6 });
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) rips.current.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, r: 0, max: 280, a: 0.6 });
    };

    window.addEventListener('mousemove', onMM, { passive: true });
    window.addEventListener('touchmove', onTM, { passive: true });
    window.addEventListener('mouseleave', onML);
    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', onTouch, { passive: true });

    const CD = 140;
    const AD = 220;

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouse.current.x, my = mouse.current.y;
      const P = pts.current;

      // Ripples
      for (let i = rips.current.length - 1; i >= 0; i--) {
        const rp = rips.current[i];
        rp.r += 5;
        rp.a -= 0.009;
        if (rp.a <= 0) { rips.current.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(270, 70%, 72%, ${rp.a})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.x += p.vx;
        p.y += p.vy;

        // Home drift
        p.vx += (p.ox - p.x) * 0.0002;
        p.vy += (p.oy - p.y) * 0.0002;

        // Mouse attraction
        const dx = mx - p.x, dy = my - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < AD && d > 3) {
          const f = ((AD - d) / AD) * 0.015;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        // Ripple push
        for (const rp of rips.current) {
          const rx = p.x - rp.x, ry = p.y - rp.y;
          const rd = Math.sqrt(rx * rx + ry * ry);
          if (Math.abs(rd - rp.r) < 35) {
            p.vx += (rx / rd) * 2 * rp.a;
            p.vy += (ry / rd) * 2 * rp.a;
          }
        }

        p.vx *= 0.985;
        p.vy *= 0.985;

        if (p.x < -20) { p.x = w + 20; p.ox = p.x; }
        if (p.x > w + 20) { p.x = -20; p.ox = p.x; }
        if (p.y < -20) { p.y = h + 20; p.oy = p.y; }
        if (p.y > h + 20) { p.y = -20; p.oy = p.y; }

        let da = p.a;
        if (d < AD) da = Math.min(0.9, p.a + (1 - d / AD) * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 65%, 65%, ${da})`;
        ctx.fill();

        // Connections
        for (let j = i + 1; j < P.length; j++) {
          const q = P[j];
          const cx = p.x - q.x, cy = p.y - q.y;
          const cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < CD) {
            let la = (1 - cd / CD) * 0.14;
            const mmx = (p.x + q.x) / 2, mmy = (p.y + q.y) / 2;
            const md = Math.sqrt((mx - mmx) ** 2 + (my - mmy) ** 2);
            if (md < AD) la += (1 - md / AD) * 0.2;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `hsla(270, 55%, 68%, ${la})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      raf.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('mouseleave', onML);
      window.removeEventListener('click', onClick);
      window.removeEventListener('touchstart', onTouch);
    };
  }, [ref]);
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════ */

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   CURSOR GLOW
   ═══════════════════════════════════════════════════════════ */

function useGlow(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = (e: MouseEvent) => { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; };
    window.addEventListener('mousemove', m, { passive: true });
    return () => window.removeEventListener('mousemove', m);
  }, [ref]);
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  const TYPEWRITER_PHRASES = useMemo(() => [
    "Personalized cognitive retraining program.",
    "Data-driven clinical insights.",
    "Accessible therapy for every child.",
    "Bridging clinical science with home care."
  ], []);

  useParticles(canvasRef);
  useReveal();
  useGlow(glowRef);

  useEffect(() => {
    // Trigger mount animations after hydration
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let timeoutId: NodeJS.Timeout;
    let i = 0;
    const currentPhrase = TYPEWRITER_PHRASES[typewriterIndex];
    
    const typeNextChar = () => {
      setDisplayedText(currentPhrase.slice(0, i));
      i++;
      if (i > currentPhrase.length) {
        timeoutId = setTimeout(() => {
          setTypewriterIndex(prev => (prev + 1) % TYPEWRITER_PHRASES.length);
        }, 2500); // Reading pause before next phrase
      } else {
        timeoutId = setTimeout(typeNextChar, 50); // Speed of typing
      }
    };
    
    timeoutId = setTimeout(typeNextChar, typewriterIndex === 0 ? 1000 : 100);
    return () => clearTimeout(timeoutId);
  }, [mounted, typewriterIndex, TYPEWRITER_PHRASES]);

  const handleEnter = useCallback(() => {
    setExiting(true);
    setTimeout(() => router.push('/auth'), 500);
  }, [router]);

  const letters = 'NeuroAdapt'.split('');

  return (
    <div
      className="relative h-screen w-screen overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
      style={{
        background: 'linear-gradient(180deg, #f8f7ff 0%, #f0eeff 40%, #ece8ff 100%)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Cursor glow (desktop only) */}
      <div
        ref={glowRef}
        className="hidden md:block"
        style={{
          position: 'fixed', width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.03) 45%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
        }}
      />

      {/* ═══════ HERO ═══════ */}
      <section 
        className="relative z-10 min-h-screen flex items-center justify-center px-5 sm:px-8 lg:px-12 snap-start"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-6 lg:gap-12">

          {/* LEFT: Title */}
          <div className="flex-1 flex flex-col justify-center text-center lg:text-left space-y-4 pt-20 lg:pt-0 order-2 lg:order-1 relative z-10 lg:pl-0">
            {/* TITLE: NeuroAdapt */}
            <h1 style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>
              {letters.map((char, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    fontSize: 'clamp(3.5rem, 9vw, 8rem)',
                    background: 'linear-gradient(90deg, #312e81 0%, #6d28d9 40%, #c084fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(50px)',
                    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.05}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.05}s`,
                  }}
                >
                  {char}
                </span>
              ))}
            </h1>

            {/* Tagline */}
            <div style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(25px)',
              transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s',
              fontFamily: "'Inter', sans-serif",
            }}>
              <p
                style={{
                  fontWeight: 400,
                  color: '#6b7280',
                  fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                  marginBottom: '12px'
                }}
              >
                Where <span style={{ color: '#8b5cf6', fontWeight: 500 }}>therapy</span> meets home.
              </p>

              {/* Typewriter Text */}
              <div 
                style={{
                  color: '#a78bfa',
                  fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                  fontWeight: 500,
                  height: '32px',
                }}
              >
                <div 
                  style={{ 
                    display: 'inline-block',
                    borderRight: '2px solid #8b5cf6',
                    animation: 'blink-caret .75s step-end infinite',
                    paddingRight: '4px',
                  }}
                >
                  {displayedText}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════ SECTION 2: Purpose ═══════ */}
      <section className="min-h-screen flex flex-col justify-center snap-start" style={{ position: 'relative', zIndex: 10, padding: '0 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          {/* Accent line */}
          <div
            data-reveal
            style={{
              width: 0, height: 3, borderRadius: 2, margin: '0 auto 24px',
              background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)',
              transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
            }}
            ref={(el) => {
              if (el && el.classList.contains('in-view')) el.style.width = '60px';
              if (el) {
                const obs = new MutationObserver(() => {
                  if (el.classList.contains('in-view')) el.style.width = '60px';
                });
                obs.observe(el, { attributes: true, attributeFilter: ['class'] });
              }
            }}
          />

          <h2
            data-reveal
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(1.5rem, 4vw, 3rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#1a1a2e',
              textAlign: 'center',
              margin: '0 auto 16px',
              opacity: 0,
              transform: 'translateY(40px)',
              transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
            }}
            ref={(el) => {
              if (el) {
                const obs = new MutationObserver(() => {
                  if (el.classList.contains('in-view')) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                  }
                });
                obs.observe(el, { attributes: true, attributeFilter: ['class'] });
              }
            }}
          >
            Structured{' '}
            <span style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              cognitive therapy
            </span>{' '}
            brought into every child&apos;s home
          </h2>

          <p
            data-reveal
            style={{
              color: '#9ca3af',
              fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
              fontWeight: 300,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto',
              textAlign: 'center',
              opacity: 0,
              transform: 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s',
            }}
            ref={(el) => {
              if (el) {
                const obs = new MutationObserver(() => {
                  if (el.classList.contains('in-view')) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                  }
                });
                obs.observe(el, { attributes: true, attributeFilter: ['class'] });
              }
            }}
          >
            AI-assisted exercises. Clinician oversight. Real-time progress tracking.
          </p>
        </div>
      </section>

      {/* ═══════ SECTION 3: Three Pillars (Neubrutalism) ═══════ */}
      <section className="min-h-screen flex flex-col justify-center snap-start" style={{ position: 'relative', zIndex: 10, padding: '0 24px' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .pillars-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            max-width: 1024px;
            margin: 0 auto;
            align-items: stretch;
            justify-content: center;
          }
          @media (min-width: 768px) {
            .pillars-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}} />
        <div className="pillars-grid">
          {[
            { emoji: '🎯', title: 'Adaptive Training', desc: 'ML-personalized difficulty within therapeutic boundaries', bg: '#f3e8ff', border: '#7c3aed', delay: 0 },
            { emoji: '🧠', title: '4 Cognitive Domains', desc: 'Attention · Memory · Reasoning · Problem Solving', bg: '#ede9fe', border: '#6d28d9', delay: 0.1 },
            { emoji: '📊', title: 'Clinician Insights', desc: 'AI-generated progress summaries for therapist review', bg: '#e8e0ff', border: '#5b21b6', delay: 0.2 },
          ].map((card, idx) => (
            <div
              key={idx}
              data-reveal
              className="text-center"
              style={{
                background: card.bg,
                border: `2.5px solid ${card.border}`,
                borderRadius: 16,
                padding: '36px 22px',
                boxShadow: `5px 5px 0px ${card.border}`,
                opacity: 0,
                transform: 'translateY(40px)',
                transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${card.delay}s`,
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              ref={(el) => {
                if (el) {
                  el.onmouseenter = () => {
                    el.style.transform = 'translate(-3px, -3px)';
                    el.style.boxShadow = `8px 8px 0px ${card.border}`;
                  };
                  el.onmouseleave = () => {
                    if (el.classList.contains('in-view')) {
                      el.style.transform = 'translate(0, 0)';
                      el.style.boxShadow = `5px 5px 0px ${card.border}`;
                    }
                  };
                  const obs = new MutationObserver(() => {
                    if (el.classList.contains('in-view')) {
                      el.style.opacity = '1';
                      el.style.transform = 'translate(0, 0)';
                    }
                  });
                  obs.observe(el, { attributes: true, attributeFilter: ['class'] });
                }
              }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  border: `2px solid ${card.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, fontSize: 24,
                  background: 'white',
                }}
              >
                {card.emoji}
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: '#1a1a2e', marginBottom: 6 }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, fontWeight: 500 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 4: Enter CTA ═══════ */}
      <section className="min-h-screen flex flex-col justify-center snap-start relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Glow behind button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 65%)' }} />

        <div
          data-reveal
          className="text-center space-y-8 relative z-10"
          style={{
            opacity: 0,
            transform: 'translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}
          ref={(el) => {
            if (el) {
              const obs = new MutationObserver(() => {
                if (el.classList.contains('in-view')) {
                  el.style.opacity = '1';
                  el.style.transform = 'translateY(0)';
                }
              });
              obs.observe(el, { attributes: true, attributeFilter: ['class'] });
            }
          }}
        >
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, color: '#c4b5fd', letterSpacing: '-0.01em' }}>
            Ready to begin?
          </p>

          <div>
            <button
              onClick={handleEnter}
              className="group"
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                color: 'white',
                border: 'none',
                padding: '18px 64px',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '0.2em',
                textTransform: 'uppercase' as const,
                borderRadius: 60,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 8px 40px -8px rgba(124,58,237,0.45)',
                transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 14px 50px -8px rgba(124,58,237,0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 40px -8px rgba(124,58,237,0.45)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              }}
            >
              Enter
            </button>
          </div>


        </div>
      </section>

      {/* Keyframes injected inline for reliability */}
      <style jsx global>{`
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #8b5cf6 }
        }
        @keyframes brainFloat {
          0%, 100% { transform: translateY(0); }
          33% { transform: translateY(-14px); }
          66% { transform: translateY(-6px); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
