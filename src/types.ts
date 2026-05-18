export type GitHubActor = {
  login: string;
};

export type GitHubRepo = {
  name: string;
  url: string;
};

export type GitHubCommit = {
  sha: string;
  message: string;
  url: string;
};

export type GitHubRelease = {
  html_url: string;
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
};

export type GitHubRepository = {
  full_name: string;
  html_url: string;
  description: string | null;
};

export type GitHubPushPayload = {
  ref: string;
  commits?: GitHubCommit[];
  size?: number;
  head?: string;
  before?: string;
};

export type GitHubReleasePayload = {
  action: string;
  release: GitHubRelease;
};

export type GitHubCreatePayload = {
  ref_type: string;
  ref: string | null;
};

export type GitHubEvent = {
  id: string;
  type: "PushEvent" | "ReleaseEvent" | "CreateEvent" | string;
  actor: GitHubActor;
  repo: GitHubRepo;
  payload: GitHubPushPayload | GitHubReleasePayload | GitHubCreatePayload | Record<string, unknown>;
  created_at: string;
};

export type StoredState = {
  seenIds: string[];
  seenRepos?: string[];
};
