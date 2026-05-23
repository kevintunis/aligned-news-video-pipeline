// Aligned News — broadcast motion graphics
// Everything sits on #00FF00 for chroma key. No gradients, no soft shadows
// that would blend into green. Solid fills only.

const GREEN = '#00FF00';

// Brand palette — saturated navy + gold, chosen so they're FAR from pure green
// in hue so chroma keyers don't pull them. No reds/magentas that muddy on
// spill-suppressed footage.
const NAVY     = '#0B1E3F';
const NAVY_DK  = '#050F22';
const GOLD     = '#F5B83D';
const GOLD_DK  = '#C48A1A';
const CREAM    = '#F5EEDC';
const INK      = '#0A0A0A';

const DISPLAY = "'Playfair Display', 'Times New Roman', serif";
const SANS    = "'Inter', system-ui, sans-serif";
const MONO    = "'JetBrains Mono', ui-monospace, monospace";

// ── Timeline map ───────────────────────────────────────────────────────────
// 0.0–5.5  Intro card: "What We're Covering Today" + 3 bullets
// 5.5–8.5  Topic transition: "Segment 01 — Policy"
// 8.5–13.5 Lower third: Kevin | Aligned News
// 13.5–16.5 Topic transition: "Segment 02 — Markets"
// 16.5–18.5 Wipe out

// ═══════════════════════════════════════════════════════════════════════════
// Shared: Aligned News brand-mark (text lockup, drawn in CSS)
// ═══════════════════════════════════════════════════════════════════════════

function BrandMark({ size = 1, color = NAVY, accent = GOLD }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14 * size,
      fontFamily: SANS,
    }}>
      {/* Monogram tile */}
      <div style={{
        width: 54 * size, height: 54 * size,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: 32 * size,
          fontWeight: 800,
          color: CREAM,
          fontStyle: 'italic',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>A</div>
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: 4 * size,
          background: accent,
        }}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * size }}>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: 28 * size,
          fontWeight: 700,
          color,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>Aligned News</div>
        <div style={{
          fontFamily: MONO,
          fontSize: 10 * size,
          color,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          opacity: 0.75,
        }}>Est. 2026  ·  Broadcast</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 1 — INTRO CARD (0.0 – 5.5s)
// Big title card with 3 bullets sliding in sequentially
// ═══════════════════════════════════════════════════════════════════════════

function IntroCard() {
  return (
    <Sprite start={0} end={5.5}>
      <IntroCardBody />
    </Sprite>
  );
}

function IntroCardBody() {
  const { localTime, duration } = useSprite();
  const exitStart = duration - 0.5;

  // Overall card wipe-in from left
  const cardWipe = localTime < 0.6
    ? Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1))
    : localTime > exitStart
      ? 1 - Easing.easeInCubic(clamp((localTime - exitStart) / 0.5, 0, 1))
      : 1;

  const bullets = [
    { n: '01', label: 'AI Safety Summit — Geneva Accord draft' },
    { n: '02', label: 'Markets open after holiday — tech leads' },
    { n: '03', label: 'Interview: Dr. Lin on alignment research' },
  ];

  // Title drops in at 0.2s
  const titleT = clamp((localTime - 0.2) / 0.55, 0, 1);
  const titleEased = Easing.easeOutCubic(titleT);

  // Eyebrow slides in first
  const eyebrowT = clamp(localTime / 0.4, 0, 1);

  return (
    <>
      {/* Left navy band — wipes in from left edge */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 720,
        background: NAVY,
        transform: `translateX(${(cardWipe - 1) * 100}%)`,
        willChange: 'transform',
      }}/>

      {/* Gold accent stripe sliding in just after */}
      <div style={{
        position: 'absolute',
        left: 720, top: 0, bottom: 0,
        width: 10,
        background: GOLD,
        transform: `translateX(${(clamp((localTime - 0.15) / 0.5, 0, 1) - 1) * 100}%)`,
        willChange: 'transform',
      }}/>

      {/* Eyebrow: BROADCAST NOTES / 05.22.26 */}
      <div style={{
        position: 'absolute',
        left: 88, top: 120,
        opacity: eyebrowT,
        transform: `translateX(${(1 - eyebrowT) * -20}px)`,
        display: 'flex', alignItems: 'center', gap: 14,
        fontFamily: MONO,
        fontSize: 14,
        letterSpacing: '0.28em',
        color: GOLD,
        textTransform: 'uppercase',
      }}>
        <span style={{
          display: 'inline-block',
          width: 36, height: 2,
          background: GOLD,
        }}/>
        <span>Broadcast Notes · 04.22.26</span>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute',
        left: 88, top: 168,
        width: 600,
        opacity: titleEased,
        transform: `translateY(${(1 - titleEased) * 20}px)`,
        fontFamily: DISPLAY,
        fontSize: 92,
        fontWeight: 800,
        color: CREAM,
        lineHeight: 0.98,
        letterSpacing: '-0.02em',
      }}>
        What <span style={{ fontStyle: 'italic', color: GOLD }}>we're</span><br/>
        covering<br/>
        today.
      </div>

      {/* Rule */}
      <div style={{
        position: 'absolute',
        left: 88, top: 560,
        width: clamp((localTime - 0.7) / 0.5, 0, 1) * 560,
        height: 1,
        background: 'rgba(245,238,220,0.35)',
      }}/>

      {/* Bullets */}
      <div style={{
        position: 'absolute',
        left: 88, top: 600,
        display: 'flex', flexDirection: 'column', gap: 28,
        width: 600,
      }}>
        {bullets.map((b, i) => {
          const start = 0.9 + i * 0.35;
          const t = clamp((localTime - start) / 0.5, 0, 1);
          const eased = Easing.easeOutCubic(t);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 22,
              opacity: eased,
              transform: `translateX(${(1 - eased) * -24}px)`,
            }}>
              <div style={{
                fontFamily: MONO,
                fontSize: 14,
                color: GOLD,
                letterSpacing: '0.1em',
                width: 30,
                flexShrink: 0,
              }}>{b.n}</div>
              <div style={{
                fontFamily: DISPLAY,
                fontSize: 26,
                fontWeight: 500,
                color: CREAM,
                lineHeight: 1.25,
                letterSpacing: '-0.005em',
              }}>{b.label}</div>
            </div>
          );
        })}
      </div>

      {/* Brand lockup, bottom-left */}
      <div style={{
        position: 'absolute',
        left: 88, bottom: 72,
        opacity: clamp((localTime - 1.2) / 0.5, 0, 1),
      }}>
        <BrandMark size={0.78} color={CREAM} accent={GOLD} />
      </div>

      {/* Right-side vertical ticker (like a broadcast ident) */}
      <div style={{
        position: 'absolute',
        right: 96, top: 120, bottom: 72,
        width: 2,
        background: 'rgba(11,30,63,0.0)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        alignItems: 'flex-end',
        opacity: clamp((localTime - 0.9) / 0.6, 0, 1),
      }}>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: '0.3em',
          color: NAVY,
          textTransform: 'uppercase',
        }}>On Air · Live Feed</div>
        <div style={{
          fontFamily: MONO,
          fontSize: 12,
          color: NAVY,
          letterSpacing: '0.2em',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}>CH 07</div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 2 — TOPIC TRANSITION (reusable)
// ═══════════════════════════════════════════════════════════════════════════

function TopicCard({ start, end, segment, title, kicker }) {
  return (
    <Sprite start={start} end={end}>
      <TopicCardBody segment={segment} title={title} kicker={kicker} />
    </Sprite>
  );
}

function TopicCardBody({ segment, title, kicker }) {
  const { localTime, duration } = useSprite();
  const exitStart = duration - 0.5;

  // Diagonal slab enters from right, exits down
  const slabIn = Easing.easeOutCubic(clamp(localTime / 0.55, 0, 1));
  const slabOut = localTime > exitStart
    ? Easing.easeInCubic(clamp((localTime - exitStart) / 0.5, 0, 1))
    : 0;

  // Text fades in behind slab motion
  const textT = clamp((localTime - 0.45) / 0.5, 0, 1);
  const textEased = Easing.easeOutCubic(textT);

  const textOut = localTime > exitStart
    ? Easing.easeInCubic(clamp((localTime - exitStart) / 0.45, 0, 1))
    : 0;

  return (
    <>
      {/* Big navy diagonal slab — skewed rectangle */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 1600, height: 420,
        background: NAVY,
        transform: `translate(-50%, -50%) skewX(-8deg) translateX(${(1 - slabIn) * 1800 + slabOut * -1800}px)`,
        willChange: 'transform',
      }}/>

      {/* Gold stripe along top of slab */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 'calc(50% - 210px)',
        width: 1600, height: 6,
        background: GOLD,
        transform: `translateX(-50%) skewX(-8deg) translateX(${(1 - slabIn) * 1800 + slabOut * -1800}px)`,
        willChange: 'transform',
      }}/>
      {/* Gold stripe along bottom of slab */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 'calc(50% + 204px)',
        width: 1600, height: 6,
        background: GOLD,
        transform: `translateX(-50%) skewX(-8deg) translateX(${(1 - slabIn) * 1800 + slabOut * -1800}px)`,
        willChange: 'transform',
      }}/>

      {/* Text block — sits above slab, un-skewed */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: `translate(-50%, -50%) translateY(${(1 - textEased) * 18 + textOut * -14}px)`,
        opacity: textEased * (1 - textOut),
        textAlign: 'center',
        width: 1400,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          fontFamily: MONO,
          fontSize: 18,
          color: GOLD,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>
          <span style={{
            display: 'inline-block', width: 40, height: 2, background: GOLD,
          }}/>
          <span>Segment {segment}</span>
          <span style={{
            display: 'inline-block', width: 40, height: 2, background: GOLD,
          }}/>
        </div>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: 128,
          fontWeight: 800,
          color: CREAM,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontStyle: 'italic',
        }}>
          {title}
        </div>
        {kicker && (
          <div style={{
            marginTop: 20,
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 400,
            color: 'rgba(245,238,220,0.75)',
            letterSpacing: '0.04em',
          }}>
            {kicker}
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 3 — LOWER THIRD (8.5 – 13.5s)
// "Kevin | Aligned News"
// ═══════════════════════════════════════════════════════════════════════════

function LowerThird() {
  return (
    <Sprite start={8.5} end={13.5}>
      <LowerThirdBody />
    </Sprite>
  );
}

function LowerThirdBody() {
  const { localTime, duration } = useSprite();
  const exitStart = duration - 0.6;

  // Bar slides in from left with a 2-layer stagger
  const bar1 = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));
  const bar2 = Easing.easeOutCubic(clamp((localTime - 0.08) / 0.5, 0, 1));
  const barOut = localTime > exitStart
    ? Easing.easeInCubic(clamp((localTime - exitStart) / 0.5, 0, 1))
    : 0;

  // Name fades in slightly after bar lands
  const nameT = clamp((localTime - 0.35) / 0.45, 0, 1);
  const nameEased = Easing.easeOutCubic(nameT);

  const subT = clamp((localTime - 0.55) / 0.45, 0, 1);
  const subEased = Easing.easeOutCubic(subT);

  // LIVE pulse
  const pulse = 0.5 + 0.5 * Math.sin(localTime * 4.5);

  // Ticker text scroll
  const tickerItems = [
    'ALIGNMENT · Geneva Accord draft released',
    'MARKETS · Nasdaq +1.2% at open',
    'POLICY · Senate hearing rescheduled',
    'RESEARCH · New interpretability paper',
  ];
  const tickerText = tickerItems.join('   ◆   ') + '   ◆   ';
  // Scroll speed: 160 px/s
  const tickerOffset = -localTime * 160;

  const barExit = barOut * -1900;
  const bar2Exit = barOut * -1900;

  return (
    <>
      {/* Back layer bar — gold, slightly taller, offset */}
      <div style={{
        position: 'absolute',
        left: 80, bottom: 150,
        width: 1050, height: 118,
        background: GOLD,
        transform: `translateX(${(bar2 - 1) * 1200 + bar2Exit}px)`,
        willChange: 'transform',
      }}/>

      {/* Front layer bar — navy */}
      <div style={{
        position: 'absolute',
        left: 60, bottom: 170,
        width: 1050, height: 118,
        background: NAVY,
        transform: `translateX(${(bar1 - 1) * 1200 + barExit}px)`,
        willChange: 'transform',
      }}/>

      {/* Left color block — cream accent */}
      <div style={{
        position: 'absolute',
        left: 60, bottom: 170,
        width: 12, height: 118,
        background: CREAM,
        transform: `translateX(${(bar1 - 1) * 1200 + barExit}px)`,
      }}/>

      {/* Name + network */}
      <div style={{
        position: 'absolute',
        left: 108, bottom: 170,
        height: 118,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        transform: `translateX(${(bar1 - 1) * 1200 + barExit}px)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 20,
          opacity: nameEased,
          transform: `translateY(${(1 - nameEased) * 8}px)`,
        }}>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: 54,
            fontWeight: 700,
            color: CREAM,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>Kevin</div>
          <div style={{
            width: 2, height: 38, background: GOLD,
            opacity: nameEased,
          }}/>
          <div style={{
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 500,
            color: GOLD,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>Aligned News</div>
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: MONO,
          fontSize: 13,
          color: 'rgba(245,238,220,0.75)',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          opacity: subEased,
          transform: `translateY(${(1 - subEased) * 6}px)`,
        }}>Anchor  ·  Reporting from New York</div>
      </div>

      {/* LIVE badge, top-left */}
      <div style={{
        position: 'absolute',
        left: 60, top: 60,
        display: 'flex', alignItems: 'center', gap: 10,
        background: NAVY,
        padding: '10px 16px',
        transform: `translateX(${(bar1 - 1) * 400 + barOut * -400}px)`,
      }}>
        <div style={{
          width: 10, height: 10,
          background: '#E63946',
          borderRadius: '50%',
          opacity: 0.4 + 0.6 * pulse,
        }}/>
        <div style={{
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 700,
          color: CREAM,
          letterSpacing: '0.28em',
        }}>LIVE</div>
      </div>

      {/* Time / date chip, top-right */}
      <div style={{
        position: 'absolute',
        right: 60, top: 60,
        display: 'flex', alignItems: 'center', gap: 14,
        background: NAVY,
        padding: '10px 18px',
        transform: `translateX(${(bar1 - 1) * -400 + barOut * 400}px)`,
        fontFamily: MONO,
        fontSize: 14,
        color: CREAM,
        letterSpacing: '0.2em',
      }}>
        <span style={{ color: GOLD }}>04.22.26</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>08:42 ET</span>
      </div>

      {/* Ticker bar at very bottom */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 60,
        height: 56,
        background: NAVY_DK,
        transform: `translateY(${(1 - bar1) * 100 + barOut * 100}%)`,
        willChange: 'transform',
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Label block */}
        <div style={{
          height: '100%',
          background: GOLD,
          padding: '0 24px',
          display: 'flex', alignItems: 'center',
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 700,
          color: NAVY,
          letterSpacing: '0.24em',
          flexShrink: 0,
        }}>TOP STORIES</div>

        {/* Scrolling text */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          display: 'flex', alignItems: 'center',
          position: 'relative',
        }}>
          <div style={{
            whiteSpace: 'nowrap',
            fontFamily: SANS,
            fontSize: 18,
            color: CREAM,
            letterSpacing: '0.08em',
            fontWeight: 500,
            transform: `translateX(${tickerOffset}px)`,
            paddingLeft: 40,
            willChange: 'transform',
          }}>
            {tickerText}{tickerText}{tickerText}
          </div>
        </div>
      </div>

      {/* Brand bug bottom-right */}
      <div style={{
        position: 'absolute',
        right: 60, bottom: 140,
        opacity: subEased,
        transform: `translateY(${(1 - subEased) * 10}px) translateX(${barOut * 400}px)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: DISPLAY,
          fontSize: 26,
          fontWeight: 700,
          color: NAVY,
          fontStyle: 'italic',
          letterSpacing: '-0.01em',
        }}>
          <div style={{
            width: 38, height: 38,
            background: NAVY,
            color: CREAM,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 22,
            fontWeight: 800,
            position: 'relative',
          }}>
            A
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: 3, background: GOLD,
            }}/>
          </div>
          Aligned
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 4 — WIPE OUT (16.5 – 18.5s)
// Diagonal navy wipe across screen, leaving green behind
// ═══════════════════════════════════════════════════════════════════════════

function WipeOut() {
  return (
    <Sprite start={16.5} end={18.5}>
      <WipeOutBody />
    </Sprite>
  );
}

function WipeOutBody() {
  const { localTime } = useSprite();

  // Phase 1: 0.0 – 1.0  — wipe IN (navy covers screen)
  // Phase 2: 1.0 – 2.0  — wipe OUT (navy leaves from opposite side)
  const inT  = Easing.easeInOutCubic(clamp(localTime / 1.0, 0, 1));
  const outT = Easing.easeInOutCubic(clamp((localTime - 1.0) / 1.0, 0, 1));

  // Two-layer wipe for richness
  const p1 = (1 - inT) * 100 + outT * -100;  // navy layer
  const p2 = (1 - clamp((localTime - 0.08) / 1.0, 0, 1)) * 100
           + clamp((localTime - 1.08) / 1.0, 0, 1) * -100;  // gold trail

  // End-card logo mid-wipe
  const logoT = clamp((localTime - 0.75) / 0.3, 0, 1);
  const logoOut = clamp((localTime - 1.15) / 0.3, 0, 1);
  const logoOpacity = logoT * (1 - logoOut);

  return (
    <>
      {/* Gold leading edge */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '120%',
        background: GOLD,
        transform: `translateX(${p2}%) skewX(-12deg)`,
        transformOrigin: 'left center',
        willChange: 'transform',
      }}/>
      {/* Navy main slab */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '120%',
        background: NAVY,
        transform: `translateX(${p1}%) skewX(-12deg)`,
        transformOrigin: 'left center',
        willChange: 'transform',
      }}/>

      {/* Centered end-card mark during full-cover moment */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: logoOpacity,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: 88,
            fontWeight: 800,
            color: CREAM,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>Aligned News</div>
          <div style={{
            marginTop: 18,
            fontFamily: MONO,
            fontSize: 16,
            color: GOLD,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}>— End of Broadcast —</div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCENE — everything composed on solid green
// ═══════════════════════════════════════════════════════════════════════════

function NewsBroadcast() {
  return (
    <>
      <IntroCard />

      <TopicCard
        start={5.5} end={8.5}
        segment="01"
        title="Policy"
        kicker="Washington · Geneva · London"
      />

      <LowerThird />

      <TopicCard
        start={13.5} end={16.5}
        segment="02"
        title="Markets"
        kicker="Pre-bell coverage · Opening indicators"
      />

      <WipeOut />
    </>
  );
}

Object.assign(window, {
  NewsBroadcast,
  IntroCard, TopicCard, LowerThird, WipeOut,
  GREEN, NAVY, GOLD, CREAM,
});
