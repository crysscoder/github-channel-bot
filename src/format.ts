import type { GitHubCreatePayload, GitHubEvent, GitHubPushPayload, GitHubReleasePayload, GitHubRepository } from "./types";

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const repoUrl = (repoName: string) => `https://github.com/${repoName}`;

const pluginName = (repoName: string) => repoName.split("/").at(-1) || repoName;

const branchName = (ref: string) => ref.replace("refs/heads/", "");

const shortSha = (sha: string) => sha.slice(0, 7);

const firstLine = (message: string) => message.split("\n")[0]?.trim() || "commit";

const isPushPayload = (payload: GitHubEvent["payload"]): payload is GitHubPushPayload => {
  const push = payload as GitHubPushPayload;
  return typeof push.ref === "string" && (Array.isArray(push.commits) || typeof push.head === "string");
};

const isReleasePayload = (payload: GitHubEvent["payload"]): payload is GitHubReleasePayload => {
  return typeof (payload as GitHubReleasePayload).action === "string" && Boolean((payload as GitHubReleasePayload).release);
};

const isCreatePayload = (payload: GitHubEvent["payload"]): payload is GitHubCreatePayload => {
  return typeof (payload as GitHubCreatePayload).ref_type === "string";
};

const formatPush = (event: GitHubEvent) => {
  if (!isPushPayload(event.payload)) {
    return null;
  }

  const repo = event.repo.name;
  const sourceCommits = Array.isArray(event.payload.commits) ? event.payload.commits : [];
  const commits = sourceCommits.slice(0, 5);
  const hidden = sourceCommits.length - commits.length;
  const lines = commits.map((commit) => {
    const url = `https://github.com/${repo}/commit/${commit.sha}`;
    return `- <a href="${url}">${shortSha(commit.sha)}</a> ${escapeHtml(firstLine(commit.message))}`;
  });

  if (lines.length === 0 && event.payload.head) {
    const url = `https://github.com/${repo}/commit/${event.payload.head}`;
    lines.push(`- <a href="${url}">${shortSha(event.payload.head)}</a> commit`);
  }

  if (lines.length === 0) {
    return null;
  }

  if (hidden > 0) {
    lines.push(`- \u0438 \u0435\u0449\u0451 ${hidden}`);
  }

  const count = typeof event.payload.size === "number" && event.payload.size > 0 ? event.payload.size : sourceCommits.length || 1;

  return [
    `\u041d\u043e\u0432\u044b\u0439 push \u0432 <a href="${repoUrl(repo)}">${escapeHtml(repo)}</a>`,
    "",
    `\u0412\u0435\u0442\u043a\u0430: <code>${escapeHtml(branchName(event.payload.ref))}</code>`,
    `\u041a\u043e\u043c\u043c\u0438\u0442\u043e\u0432: ${count}`,
    ...lines
  ].join("\n");
};

const formatRelease = (event: GitHubEvent) => {
  if (!isReleasePayload(event.payload) || event.payload.action !== "published") {
    return null;
  }

  const release = event.payload.release;

  if (release.draft) {
    return null;
  }

  const title = release.name || release.tag_name;
  const repo = event.repo.name;

  return [
    `\u0423\u0440\u0430! \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0432\u044b\u0448\u0435\u043b \u0440\u0435\u043b\u0438\u0437 <a href="${release.html_url}">${escapeHtml(release.tag_name)}</a> \u0434\u043b\u044f \u043f\u043b\u0430\u0433\u0438\u043d\u0430 <a href="${repoUrl(repo)}">${escapeHtml(pluginName(repo))}</a>.`,
    "",
    `\u041a\u0440\u0430\u0442\u043a\u043e\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435: ${escapeHtml(title)}`
  ].join("\n");
};

const formatCreate = (event: GitHubEvent) => {
  if (!isCreatePayload(event.payload) || event.payload.ref_type !== "repository") {
    return null;
  }

  return [
    `\u041d\u043e\u0432\u044b\u0439 \u0440\u0435\u043f\u043e\u0437\u0438\u0442\u043e\u0440\u0438\u0439`,
    "",
    `<a href="${repoUrl(event.repo.name)}">${escapeHtml(event.repo.name)}</a>`
  ].join("\n");
};

export const formatEvent = (event: GitHubEvent) => {
  if (event.type === "PushEvent") {
    return formatPush(event);
  }

  if (event.type === "ReleaseEvent") {
    return formatRelease(event);
  }

  if (event.type === "CreateEvent") {
    return formatCreate(event);
  }

  return null;
};

export const formatRepository = (repo: GitHubRepository) => {
  const name = pluginName(repo.full_name);
  const description = repo.description || "\u043d\u043e\u0432\u044b\u0439 Paper-\u043f\u043b\u0430\u0433\u0438\u043d";

  const lines = [
    `\u0423\u0440\u0430! \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0431\u044b\u043b \u0432\u044b\u043b\u043e\u0436\u0435\u043d \u043f\u043b\u0430\u0433\u0438\u043d <a href="${repo.html_url}">${escapeHtml(name)}</a>.`,
    "",
    `\u041a\u0440\u0430\u0442\u043a\u043e\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435: ${escapeHtml(description)}`
  ];

  return lines.join("\n");
};
