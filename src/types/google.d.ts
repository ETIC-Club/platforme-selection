export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface GoogleIdInitializeConfig {
  client_id?: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleIdButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdInitializeConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleIdButtonConfig) => void;
  prompt?: () => void;
}

export interface GoogleIdentityServices {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}
