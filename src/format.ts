import type { GitHubCreatePayload, GitHubEvent, GitHubPushPayload, GitHubReleasePayload } from "./types";

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const repoUrl = (repoName: string) => `https://github.com/${repoName}`;

const branchName = (ref: string) => ref.replace("refs/heads/", "");

const shortSha = (sha: string) => sha.slice(0, 7);

const firstLine = (message: string) => message.split("\n")[0]?.trim() || "commit";

const isPushPayload = (payload: GitHubEvent["payload"]): payload is GitHubPushPayload => {
  return Array.isArray((payload as GitHubPushPayload).commits);
};

const isReleasePayload = (payload: GitHubEvent["payload"]): payload is GitHubReleasePayload => {
  return typeof (payload as GitHubReleasePayload).action === "string" && Boolean((payload as GitHubReleasePayload).release);
};

const isCreatePayload = (payload: GitHubEvent["payload"]): payload is GitHubCreatePayload => {
  return typeof (payload as GitHubCreatePayload).ref_type === "string";
};

const formatPush = (event: GitHubEvent) => {
  if (!isPushPayload(event.payload) || event.payload.commits.length === 0) {
    return null;
  }

  const repo = event.repo.name;
  const commits = event.payload.commits.slice(0, 5);
  const hidden = event.payload.commits.length - commits.length;
  const lines = commits.map((commit) => {
    const url = `https://github.com/${repo}/commit/${commit.sha}`;
    return `- <a href="${url}">${shortSha(commit.sha)}</a> ${escapeHtml(firstLine(commit.message))}`;
  });

  if (hidden > 0) {
    lines.push(`- \u0438 \u0435\u0449\u0451 ${hidden}`);
  }

  return [
    `\u041d\u043e\u0432\u044b\u0439 push \u0432 <a href="${repoUrl(repo)}">${escapeHtml(repo)}</a>`,
    "",
    `\u0412\u0435\u0442\u043a\u0430: <code>${escapeHtml(branchName(event.payload.ref))}</code>`,
    `\u041a\u043e\u043c\u043c\u0438\u0442\u043e\u0432: ${event.payload.commits.length}`,
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

  return [
    `\u041d\u043e\u0432\u044b\u0439 \u0440\u0435\u043b\u0438\u0437 \u0432 <a href="${repoUrl(event.repo.name)}">${escapeHtml(event.repo.name)}</a>`,
    "",
    `\u0412\u0435\u0440\u0441\u0438\u044f: <a href="${release.html_url}">${escapeHtml(release.tag_name)}</a>`,
    `\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435: ${escapeHtml(title)}`
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
