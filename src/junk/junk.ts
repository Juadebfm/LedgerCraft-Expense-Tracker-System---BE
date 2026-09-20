export type CurrencyCode = "NGN" | "USD";
export type WorkspaceId = string;
export type WorkspaceRole = "admin" | "member";

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

export interface SignUpResult {
  user: AuthenticatedUser | null;
  session: AuthSession | null;
}

export interface UserProfile {
  fullName: string;
  avatarPath: string | null;
  timezone: string | null;
}

export interface Workspace {
  id: WorkspaceId;
  name: string;
  slug: string;
  type: "Personal" | "organization";
  reportingCurrency: CurrencyCode;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  profileId: string;
  role: WorkspaceRole;
  joinedAt: string;
}


// Come back to this we might need to exp state the current user if present or null
export interface CurrentUser {
  user: AuthenticatedUser;
  profile: UserProfile;
  workspaces: Workspace[];
}

export interface AuthGateway {
  signUp(input: {
    email: string;
    password: string;
    fullName: string;
    reportingCurrency: CurrencyCode;
  }): Promise<SignUpResult>;
  signIn(input: {
    email: string;
    password: string;
  }): Promise<AuthSession | null>;
  requestPasswordRecovery(input: {
    email: string;
    redirectTo?: string;
  }): Promise<void>;
  authenticate(input: { accessToken: string }): Promise<AuthenticatedUser | null>;
  signOut(input: { accessToken: string }): Promise<void>;
  updatePassword(input: {
    accessToken: string;
    password: string;
  }): Promise<AuthenticatedUser>;
  getCurrentUser(input: { accessToken: string }): Promise<CurrentUser | null>;
  updateProfile(input: {
    accessToken: string;
    fullName?: string;
    avatarPath?: string | null;
    timezone?: string | null;
  }): Promise<UserProfile>;
  createOrganizationWorkspace(input: {
    accessToken: string;
    name: string;
    reportingCurrency: CurrencyCode;
  }): Promise<Workspace>;
  listWorkspaceMembers(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
  }): Promise<WorkspaceMember[]>;
  addWorkspaceMembers(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
    members: Array<{
      profileId: string;
      role: WorkspaceRole;
    }>;
  }): Promise<WorkspaceMember[]>;
  setWorkspaceMemberRoles(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
    members: Array<{
      profileId: string;
      role: WorkspaceRole;
    }>;
  }): Promise<WorkspaceMember[]>;
  removeWorkspaceMember(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
    profileId: string;
  }): Promise<void>;
}
