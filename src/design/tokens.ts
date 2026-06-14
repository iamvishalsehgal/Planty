// ── Planty Design System ──
// Nature-inspired: sage, soil, sky, clay, cream
// Glass-morphism surfaces, spring-physics motion

export const colors = {
  sage: {
    50: "#F4F7F2",
    100: "#E5EDE0",
    200: "#CCDBC2",
    300: "#A8C79B",
    400: "#84B075",
    500: "#669955",
    600: "#4F7A42",
    700: "#3F6135",
    800: "#354E2D",
    900: "#2D4127",
    950: "#152312",
  },
  soil: {
    50: "#F9F6F0",
    100: "#F0E8D8",
    200: "#E0CFB0",
    300: "#CDB080",
    400: "#BD935C",
    500: "#B08041",
    600: "#976835",
    700: "#7D502D",
    800: "#69432A",
    900: "#5A3926",
    950: "#331E13",
  },
  sky: {
    50: "#F0F6FC",
    100: "#E0ECF8",
    200: "#C0D9F2",
    300: "#8DBDE7",
    400: "#549DD8",
    500: "#3381C6",
    600: "#2366A8",
    700: "#1E5288",
    800: "#1D4671",
    900: "#1D3C5E",
    950: "#13273E",
  },
  clay: {
    50: "#FDF8F6",
    100: "#FBEEEA",
    200: "#F5DBD3",
    300: "#EDC0B0",
    400: "#E29C82",
    500: "#D67B5B",
    600: "#C46240",
    700: "#A44F35",
    800: "#894430",
    900: "#723B2C",
    950: "#3D1C15",
  },
  cream: {
    50: "#FEFDFB",
    100: "#FCF9F2",
    200: "#F9F2E0",
    300: "#F5F1EB",
    400: "#EDE0C8",
    500: "#E5CFA5",
    600: "#D4B37A",
    700: "#BA9450",
    800: "#9E7A3D",
    900: "#826435",
    950: "#46351C",
  },
} as const;

export const semantic = {
  surface: {
    primary: "#FEFDFB",
    secondary: "#F5F1EB",
    tertiary: "#F0E8D8",
    inverse: "#2D4127",
    glass: "rgba(254, 253, 251, 0.72)",
  },
  text: {
    primary: "#2D4127",
    secondary: "#69432A",
    tertiary: "#826435",
    inverse: "#FEFDFB",
    muted: "#9E7A3D",
  },
  status: {
    healthy: "#669955",
    warning: "#D67B5B",
    danger: "#C46240",
    info: "#3381C6",
    dry: "#BA9450",
    overdue: "#A44F35",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

export const typography = {
  display: {
    xl: { fontSize: 48, lineHeight: 52, letterSpacing: -0.02, weight: "800" },
    lg: { fontSize: 36, lineHeight: 40, letterSpacing: -0.02, weight: "700" },
    md: { fontSize: 28, lineHeight: 32, letterSpacing: -0.01, weight: "700" },
  },
  title: {
    lg: { fontSize: 22, lineHeight: 28, weight: "600" },
    md: { fontSize: 18, lineHeight: 24, weight: "600" },
    sm: { fontSize: 16, lineHeight: 22, weight: "600" },
  },
  body: {
    lg: { fontSize: 17, lineHeight: 24, weight: "400" },
    md: { fontSize: 15, lineHeight: 22, weight: "400" },
    sm: { fontSize: 13, lineHeight: 18, weight: "400" },
  },
  label: {
    md: { fontSize: 14, lineHeight: 20, weight: "500" },
    sm: { fontSize: 12, lineHeight: 16, weight: "500" },
  },
} as const;

export const glass = {
  sm: {
    backgroundColor: "rgba(254, 253, 251, 0.64)",
    backdropFilter: "blur(12px)",
    borderWidth: 1,
    borderColor: "rgba(240, 232, 216, 0.6)",
    shadowColor: "#2D4127",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  md: {
    backgroundColor: "rgba(254, 253, 251, 0.72)",
    backdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(240, 232, 216, 0.5)",
    shadowColor: "#2D4127",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
} as const;

export const spring = {
  snappy: {
    damping: 14,
    stiffness: 200,
    mass: 0.8,
  },
  bouncy: {
    damping: 8,
    stiffness: 160,
    mass: 1,
  },
  gentle: {
    damping: 18,
    stiffness: 140,
    mass: 1,
  },
  slow: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
} as const;
