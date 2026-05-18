import type { Config } from "./config";
import type { GitHubEvent, GitHubRepository } from "./types";

const createHeaders = (config: Config) => {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "github-channel-bot"
  });

  if (config.githubToken) {
    headers.set("Authorization", `Bearer ${config.githubToken}`);
  }

  return headers;
};

export const fetchEvents = async (config: Config): Promise<GitHubEvent[]> => {
  const url = `https://api.github.com/users/${config.githubUser}/events/public?per_page=30`;
  const headers = createHeaders(config);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub ${response.status}: ${text}`);
  }

  return await response.json() as GitHubEvent[];
};

export const fetchRepositories = async (config: Config): Promise<GitHubRepository[]> => {
  const url = `https://api.github.com/users/${config.githubUser}/repos?type=owner&sort=created&direction=desc&per_page=30`;
  const headers = createHeaders(config);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub ${response.status}: ${text}`);
  }

  return await response.json() as GitHubRepository[];
};
