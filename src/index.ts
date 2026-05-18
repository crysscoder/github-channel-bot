import { config } from "./config";
import { formatEvent, formatRepository } from "./format";
import { fetchEvents, fetchRepositories } from "./github";
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
    const seenRepos = new Set(state.seenRepos ?? []);
    const events = await fetchEvents(config);
    const repos = await fetchRepositories(config);
    const fresh = events
      .filter((event) => !seen.has(event.id))
      .reverse();
    const save = async () => {
      await saveState(config.stateFile, {
        seenIds: Array.from(seen),
        seenRepos: Array.from(seenRepos)
      });
    };

    if (state.seenIds.length === 0 && config.startupMode === "mark_seen") {
      for (const event of events) {
        seen.add(event.id);
      }

      for (const repo of repos) {
        seenRepos.add(repo.full_name);
      }

      await save();
      console.log(`Marked ${events.length} events and ${repos.length} repos as seen`);
      return;
    }

    const { sendTelegramMessage } = await import("./telegram");

    if (!state.seenRepos && config.startupMode === "mark_seen") {
      for (const repo of repos) {
        seenRepos.add(repo.full_name);
      }

      await save();
      console.log(`Marked ${repos.length} repos as seen`);
    } else {
      const freshRepos = repos
        .filter((repo) => !seenRepos.has(repo.full_name))
        .reverse();

      for (const repo of freshRepos) {
        await sendTelegramMessage(config, formatRepository(repo));
        seenRepos.add(repo.full_name);
        await save();
        console.log(`Sent Repository ${repo.full_name}`);
        await sleep(700);
      }
    }

    for (const event of fresh) {
      const text = formatEvent(event);

      if (!text) {
        seen.add(event.id);
        await save();
        continue;
      }

      await sendTelegramMessage(config, text);
      seen.add(event.id);
      await save();
      console.log(`Sent ${event.type} ${event.repo.name} ${event.id}`);
      await sleep(700);
    }

    await save();
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
