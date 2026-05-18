export type StartupMode = "mark_seen" | "publish_recent";

export type Config = {
  githubUser: string;
  githubToken: string | null;
  telegramBotToken: string;
  telegramChatId: string;
  pollIntervalMs: number;
  startupMode: StartupMode;
  stateFile: string;
  dryRun: boolean;
  runOnce: boolean;
};

const read = (key: string, fallback = "") => Bun.env[key] ?? fallback;

const dryRun = read("DRY_RUN", "false").trim().toLowerCase() === "true";

const requireValue = (key: string) => {
  const value = read(key).trim();

  if (!value && !dryRun) {
    throw new Error(`Missing ${key}`);
  }

  return value;
};

const readStartupMode = (): StartupMode => {
  const value = read("STARTUP_MODE", "mark_seen").trim();

  if (value === "publish_recent") {
    return value;
  }

  return "mark_seen";
};

export const config: Config = {
  githubUser: read("GITHUB_USER", "crysscoder").trim(),
  githubToken: read("GITHUB_TOKEN").trim() || null,
  telegramBotToken: requireValue("TELEGRAM_BOT_TOKEN"),
  telegramChatId: requireValue("TELEGRAM_CHAT_ID"),
  pollIntervalMs: Math.max(Number(read("POLL_INTERVAL_SECONDS", "60")), 15) * 1000,
  startupMode: readStartupMode(),
  stateFile: read("STATE_FILE", "state.json").trim(),
  dryRun,
  runOnce: read("RUN_ONCE", "false").trim().toLowerCase() === "true"
};
