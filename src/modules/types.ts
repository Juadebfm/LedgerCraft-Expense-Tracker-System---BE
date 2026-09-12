export type CurrencyCode = "NGN" | "USD";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  tokenType: string;
}

export interface CurrentUser {
  user: AuthenticatedUser;
  profile: {
    fullName: string;
    avatarPath: string | null;
    timezone: string | null;
  };
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    type: "Personal" | "organization";
    reportingCurrency: CurrencyCode;
    role: "admin" | "member";
  }>;
}

export interface AuthGateway {}
