import React from 'react';

// Procedural SVG Monster Generator
export interface MonsterParts {
  bodyShape: number
  headShape: number
  eyeStyle: number
  mouthStyle: number
  limbStyle: number
  accessory: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  seed: number
}

const COLORS = [
  '#ECDC51', '#51ec7a', '#ec5151', '#51b8ec', '#c451ec',
  '#ec9851', '#51ecdc', '#8dec51', '#ec51a8', '#5168ec',
  '#2a8c4a', '#8c6b2a', '#2a6b8c', '#8c2a6b', '#6b8c2a',
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateMonster(seed?: number): MonsterParts {
  const s = seed ?? Math.floor(Math.random() * 999999)
  const rand = seededRandom(s)
  const pick = (n: number) => Math.floor(rand() * n)
  const pickColor = () => COLORS[pick(COLORS.length)]

  return {
    bodyShape: pick(5),
    headShape: pick(4),
    eyeStyle: pick(6),
    mouthStyle: pick(5),
    limbStyle: pick(4),
    accessory: pick(6),
    primaryColor: pickColor(),
    secondaryColor: pickColor(),
    accentColor: pickColor(),
    seed: s,
  }
}

export function MonsterSVG({ parts, size = 200 }: { parts: MonsterParts; size?: number }) {
  const { bodyShape, headShape, eyeStyle, mouthStyle, limbStyle, accessory, primaryColor, secondaryColor, accentColor } = parts

  const renderBody = () => {
    switch (bodyShape) {
      case 0: return <ellipse cx="100" cy="130" rx="50" ry="60" fill={primaryColor} />
      case 1: return <rect x="55" y="75" width="90" height="110" rx="8" fill={primaryColor} />
      case 2: return <polygon points="100,70 150,185 50,185" fill={primaryColor} />
      case 3: return <path d="M60,180 Q60,70 100,70 Q140,70 140,180 Z" fill={primaryColor} />
      default: return <path d="M50,130 Q50,60 100,80 Q150,60 150,130 Q150,190 100,185 Q50,190 50,130" fill={primaryColor} />
    }
  }

  const renderHead = () => {
    const y = bodyShape === 2 ? 55 : 60
    switch (headShape) {
      case 0: return <circle cx="100" cy={y} r="35" fill={secondaryColor} />
      case 1: return <rect x="68" y={y - 30} width="64" height="55" rx="5" fill={secondaryColor} />
      case 2: return <polygon points={`100,${y - 35} 135,${y + 15} 65,${y + 15}`} fill={secondaryColor} />
      default: return <ellipse cx="100" cy={y} rx="40" ry="28" fill={secondaryColor} />
    }
  }

  const renderEyes = () => {
    const y = bodyShape === 2 ? 52 : 57
    switch (eyeStyle) {
      case 0: return (<>
        <circle cx="88" cy={y} r="8" fill="white" /><circle cx="112" cy={y} r="8" fill="white" />
        <circle cx="90" cy={y} r="4" fill="#111" /><circle cx="114" cy={y} r="4" fill="#111" />
      </>)
      case 1: return <circle cx="100" cy={y} r="12" fill="white"><animate attributeName="r" values="12;10;12" dur="2s" repeatCount="indefinite"/></circle>
      case 2: return (<>
        <circle cx="85" cy={y} r="10" fill={accentColor} /><circle cx="115" cy={y} r="10" fill={accentColor} />
        <circle cx="85" cy={y} r="5" fill="#111" /><circle cx="115" cy={y} r="5" fill="#111" />
      </>)
      case 3: return (<>
        <rect x="80" y={y - 6} width="14" height="12" rx="2" fill="white" />
        <rect x="106" y={y - 6} width="14" height="12" rx="2" fill="white" />
        <rect x="84" y={y - 3} width="6" height="6" fill="#111" />
        <rect x="110" y={y - 3} width="6" height="6" fill="#111" />
      </>)
      case 4: return (<>
        <line x1="80" y1={y} x2="96" y2={y - 4} stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="104" y1={y - 4} x2="120" y2={y} stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
      </>)
      default: return (<>
        <circle cx="85" cy={y} r="9" fill="white" /><circle cx="115" cy={y} r="6" fill="white" />
        <circle cx="87" cy={y} r="4" fill="#111" /><circle cx="116" cy={y} r="3" fill="#111" />
      </>)
    }
  }

  const renderMouth = () => {
    const y = bodyShape === 2 ? 72 : 77
    switch (mouthStyle) {
      case 0: return <path d={`M85,${y} Q100,${y + 12} 115,${y}`} fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      case 1: return <rect x="88" y={y} width="24" height="10" rx="2" fill="#111" />
      case 2: return (<>
        <path d={`M85,${y} Q100,${y + 15} 115,${y}`} fill="#111" />
        <rect x="90" y={y} width="5" height="5" fill="white" /><rect x="105" y={y} width="5" height="5" fill="white" />
      </>)
      case 3: return <circle cx="100" cy={y + 3} r="6" fill="#111" />
      default: return <line x1="85" y1={y + 3} x2="115" y2={y + 3} stroke="#111" strokeWidth="2" strokeLinecap="round" />
    }
  }

  const renderLimbs = () => {
    switch (limbStyle) {
      case 0: return (<>
        <rect x="40" y="110" width="15" height="8" rx="4" fill={primaryColor} />
        <rect x="145" y="110" width="15" height="8" rx="4" fill={primaryColor} />
        <rect x="70" y="175" width="12" height="20" rx="4" fill={primaryColor} />
        <rect x="118" y="175" width="12" height="20" rx="4" fill={primaryColor} />
      </>)
      case 1: return (<>
        <path d="M55,110 Q30,100 35,130" stroke={primaryColor} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M145,110 Q170,100 165,130" stroke={primaryColor} strokeWidth="6" fill="none" strokeLinecap="round" />
      </>)
      case 2: return (<>
        <ellipse cx="65" cy="185" rx="15" ry="8" fill={secondaryColor} />
        <ellipse cx="135" cy="185" rx="15" ry="8" fill={secondaryColor} />
      </>)
      default: return (<>
        <circle cx="48" cy="120" r="8" fill={secondaryColor} />
        <circle cx="152" cy="120" r="8" fill={secondaryColor} />
        <circle cx="75" cy="190" r="8" fill={secondaryColor} />
        <circle cx="125" cy="190" r="8" fill={secondaryColor} />
      </>)
    }
  }

  const renderAccessory = () => {
    const y = bodyShape === 2 ? 20 : 25
    switch (accessory) {
      case 0: return null
      case 1: return (<>
        <line x1="90" y1={y + 5} x2="85" y2={y - 15} stroke={accentColor} strokeWidth="2" />
        <circle cx="85" cy={y - 18} r="4" fill={accentColor} />
        <line x1="110" y1={y + 5} x2="115" y2={y - 15} stroke={accentColor} strokeWidth="2" />
        <circle cx="115" cy={y - 18} r="4" fill={accentColor} />
      </>)
      case 2: return <polygon points={`100,${y - 20} 80,${y + 10} 120,${y + 10}`} fill={accentColor} opacity="0.8" />
      case 3: return (<>
        <circle cx="70" cy={y + 15} r="3" fill={accentColor} opacity="0.6" />
        <circle cx="85" cy={y + 5} r="2" fill={accentColor} opacity="0.4" />
        <circle cx="130" cy={y + 15} r="3" fill={accentColor} opacity="0.6" />
      </>)
      case 4: return <rect x="75" y={y - 8} width="50" height="12" rx="6" fill={accentColor} opacity="0.7" />
      default: return (<>
        <line x1="60" y1="95" x2="40" y2="80" stroke={accentColor} strokeWidth="2" />
        <polygon points="40,80 35,70 45,72" fill={accentColor} />
      </>)
    }
  }

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`glow-${parts.seed}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#glow-${parts.seed})`}>
        {renderLimbs()}
        {renderBody()}
        {renderHead()}
        {renderEyes()}
        {renderMouth()}
        {renderAccessory()}
      </g>
    </svg>
  )
}

// Small inline monster for decorating sections
export function MiniMonster({ seed, size = 60 }: { seed: number; size?: number }) {
  const parts = generateMonster(seed)
  return <MonsterSVG parts={parts} size={size} />
}
