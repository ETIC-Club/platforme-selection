export const ASSETS = {
  logo: "/logo-etic.png",
} as const;

export const PALETTE = {
  primary: {
    teal: "#02A9A2",
    red: "#C1333F",
    yellow: "#FFCA00",
    orange: "#EC9E00",
    green: "#1AAF5D",
  },
  secondary: {
    black: "#272421",
    beige: "#FFFCF7",
  },
  additional: {
    mint: "#00DABF",
    coral: "#F6415C",
    lightGold: "#E7BE6B",
    snow: "#FFFAFA",
    white: "#FFFFFF",
  },
} as const;

export const GRADIENTS = {
  G1: "linear-gradient(135deg, #C1333F 0%, #EC9E00 100%)",
  G2: "linear-gradient(135deg, #E7BE6B 0%, #EC9E00 100%)",
  G3: "linear-gradient(135deg, #FFFAFA 0%, #FFCA00 100%)",
  G4: "linear-gradient(135deg, #02A9A2 0%, #00DABF 100%)",
  G5: "linear-gradient(135deg, #02A9A2 0%, #1AAF5D 100%)",
} as const;

export type AllowedBackground = "red" | "gradient-1" | "gradient-2" | "gradient-5" | "beige";

export const ALLOWED_TEXT_COLORS: Record<AllowedBackground, readonly string[]> = {
  "red": ["white", "gradient-1", "gradient-3"],
  "gradient-1": ["white"],
  "gradient-2": ["white", "red", "gradient-3"],
  "gradient-5": ["white"],
  "beige": ["black", "gradient-1", "gradient-5", "red", "orange"],
} as const;

export const FONTS = {
  primary: "var(--font-primary)",
  secondary: "var(--font-secondary)",
} as const;
