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

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  reportingCurrency: CurrencyCode;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  fullName?: string;
  timezone?: string | null;
}

export interface AvatarUpload {
  content: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
}

export interface Profile {
  fullName: string;
  avatarUrl: string | null;
  timezone: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  type: "personal" | "organization";
  reportingCurrency: CurrencyCode;
  role: WorkspaceRole;
}

export interface CreateOrganizationWorkspaceInput {
  name: string;
  slug: string;
  reportCurrency: CurrencyCode;
}

export interface WorkspaceMember {
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface AddWorkspaceMemberInput {
  workspaceId: string;
  profileId: string;
  role: WorkspaceRole;
}

export interface InviteWorkspaceMemberInput {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}

export interface UpdateWorkspaceMemberInput {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}

export interface RemoveWorkspaceMemberInput {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}

export interface CurrentUser {
  user: AuthenticatedUser;
  profile: Profile;
  workspaces: WorkspaceSummary[];
}

export interface AuthGateway {
  signUp(
    input: SignUpInput,
  ): Promise<{ user: AuthenticatedUser | null; session: AuthSession | null }>;
  signIn(input: SignInInput): Promise<AuthSession | null>;
  requestPasswordRecovery(input: {
    email: string;
    redirectTo?: string;
  }): Promise<void>;
  authenticate(input: {
    accessToken: string;
  }): Promise<AuthenticatedUser | null>;
  signOut(input: { accessToken: string }): Promise<void>;
  updatePassword(input: {
    accessToken: string;
    password: string;
  }): Promise<AuthenticatedUser>;
  getCurrentUser(input: { accessToken: string }): Promise<CurrentUser | null>;
  updateProfile(
    input: { accessToken: string } & ProfileUpdateInput,
  ): Promise<Profile>;
  createOrganizationWorkspace(input: {
    accessToken: string;
    name: string;
    reportingCurrency: CurrencyCode;
  }): Promise<WorkspaceSummary>;
  listWorkspaceMembers(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
  }): Promise<WorkspaceMember[]>;
  addWorkspaceMember(
    input: { accessToken: string } & AddWorkspaceMemberInput,
  ): Promise<WorkspaceMember>;
  updateWorkspaceMember(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
    profileId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember>;
  removeWorkspaceMember(input: {
    accessToken: string;
    workspaceId: WorkspaceId;
    profileId: string;
  }): Promise<void>;
}
