export type CurrencyCode = "NGN" | "USD";
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
  type: "personal" | "organisation";
  reportingCurrency: CurrencyCode;
  role: WorkspaceRole;
}

export interface CreateOrganisationWorkspaceInput {
  name: string;
  slug: string;
  reportingCurrency: CurrencyCode;
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

export interface UpdateWorkspaceMemberRoleInput {
  workspaceId: string;
  profileId: string;
  role: WorkspaceRole;
}

export interface RemoveWorkspaceMemberInput {
  workspaceId: string;
  profileId: string;
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
  signIn(input: SignInInput): Promise<AuthSession>;
  requestPasswordRecovery(email: string): Promise<void>;
  signOut(accessToken: string): Promise<void>;
  updatePassword(accessToken: string, password: string): Promise<void>;
  getCurrentUser(accessToken: string): Promise<CurrentUser>;
  updateProfile(accessToken: string, input: ProfileUpdateInput): Promise<Profile>;
  uploadAvatar(accessToken: string, avatar: AvatarUpload): Promise<Profile>;
  softDeleteCurrentUser(accessToken: string): Promise<void>;
  createOrganisationWorkspace(
    accessToken: string,
    input: CreateOrganisationWorkspaceInput,
  ): Promise<WorkspaceSummary>;
  listWorkspaceMembers(accessToken: string, workspaceId: string): Promise<WorkspaceMember[]>;
  addWorkspaceMember(accessToken: string, input: AddWorkspaceMemberInput): Promise<void>;
  inviteWorkspaceMember(
    accessToken: string,
    input: InviteWorkspaceMemberInput,
  ): Promise<AuthenticatedUser>;
  setWorkspaceMemberRole(
    accessToken: string,
    input: UpdateWorkspaceMemberRoleInput,
  ): Promise<void>;
  removeWorkspaceMember(accessToken: string, input: RemoveWorkspaceMemberInput): Promise<void>;
}
