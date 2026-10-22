import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined, props: P): SVGProps<SVGSVGElement> {
  const { size: _s, ...rest } = props;
  void _s;
  return {
    width: size ?? 20,
    height: size ?? 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
  };
}

export const IconSpeaker = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z" fill="currentColor" stroke="none" />
    <path d="M16 9a4.5 4.5 0 0 1 0 6" />
    <path d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6" />
  </svg>
);

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconCross = ({ size, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={3}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconClose = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" stroke="none" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconStar = ({ size, filled = false, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5L2.5 9.7l6.6-.9z" />
  </svg>
);

export const IconFlame = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M12.5 2c.6 3.6 3.6 5.2 4.8 8.2 1.4 3.5-.3 8.3-4.4 9.6a5 5 0 0 1-1.3.2 5.5 5.5 0 0 1-5.6-5.6c0-2.6 1.6-3.8 2.3-5.4.4 1.3.5 2.5 1.8 3.1C10.3 9.3 10 5.3 12.5 2z" />
  </svg>
);

export const IconBolt = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12.5L13 2z" />
  </svg>
);

export const IconBook = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    <path d="M8 7h8M8 10.5h6" />
  </svg>
);

export const IconDumbbell = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />
  </svg>
);

export const IconCubes = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="8.5" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="13" width="7" height="7" rx="1.5" />
    <rect x="14" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconPath = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
    <circle cx="8" cy="19" r="2.5" />
    <path d="M8.3 6.2l7.5 4.4M15.8 13.4l-5.7 4.1" />
  </svg>
);

export const IconRefresh = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const IconUser = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
  </svg>
);

export const IconGear = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.3-4.3" />
  </svg>
);

export const IconArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconTrophy = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
    <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
    <path d="M12 13v4M8.5 20h7M10 17h4v3h-4z" />
  </svg>
);

export const IconMusic = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M9 18V6l10-2.5V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

export const IconWave = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M3 12h2l2.5-5 3 10 3-14 3 12 2.5-6 1.5 3H22" />
  </svg>
);

export const IconSpeech = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 5.5h16v10.5H9.5L5 20v-4H4V5.5z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </svg>
);

export const IconPlay = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M7 4.5v15l12-7.5L7 4.5z" />
  </svg>
);

export const IconStop = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const IconTrash = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

export const IconArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
