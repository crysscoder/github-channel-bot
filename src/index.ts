import { config } from "./config";
import { formatEvent } from "./format";
import { fetchEvents } from "./github";
import { loadState, saveState } from "./state";

let running = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tick = async () => {
  if (running) {
    return;
  }

  running = true;

  try {
    const state = await loadState(config.stateFile);
    const seen = new Set(state.seenIds);
    const events = await fetchEvents(config);
    const fresh = events
      .filter((event) => !seen.has(event.id))
      .reverse();

    if (state.seenIds.length === 0 && config.startupMode === "mark_seen") {
      await saveState(config.stateFile, { seenIds: events.map((event) => event.id) });
      console.log(`Marked ${events.length} events as seen`);
      return;
    }

    for (const event of fresh) {
      const text = formatEvent(event);
      seen.add(event.id);

      if (!text) {
        continue;
      }

      const { sendTelegramMessage } = await import("./telegram");
      await sendTelegramMessage(config, text);
      await sleep(700);
    }

    await saveState(config.stateFile, { seenIds: Array.from(seen) });
  } finally {
    running = false;
  }
};

console.log(`Watching ${config.githubUser}`);
await tick();

if (config.runOnce) {
  process.exit(0);
}

setInterval(() => {
  tick().catch((error) => console.error(error));
}, config.pollIntervalMs);
