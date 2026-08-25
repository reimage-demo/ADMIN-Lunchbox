export default function Icon({ name, size = 20 }) {
  const paths = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: (
      <>
        <path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 2 4 6 0 9" />
      </>
    ),
    "bottle-service": (
      <>
        <path d="M9 3h6M10 3v4l-3 4v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8l-3-4V3" />
        <path d="M7 13h10" />
      </>
    ),
    pricing: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .9-3 2.2 0 3.3 6 1.4 6 4.6 0 1.3-1.3 2.2-3 2.2-1.2 0-2.4-.4-3.2-1.2M12.5 5.5v13" />
      </>
    ),
    coupons: (
      <>
        <path d="M4 7.5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a3 3 0 0 0 0 5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6.5a3 3 0 0 0 0-5Z" />
        <path d="M12 7v2M12 12v2M12 17v1" />
      </>
    ),
    events: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M21 3l-10 10" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      </>
    ),
    collapse: (
      <>
        <path d="M9 18l-6-6 6-6M3 12h13" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </>
    ),
    expand: (
      <>
        <path d="M15 6l6 6-6 6M21 12H8" />
        <rect x="3" y="3" width="4" height="18" rx="1" />
      </>
    ),
    navigation: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
  };

  return (
    <svg
      className="ui-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
