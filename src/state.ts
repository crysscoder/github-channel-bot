import type { StoredState } from "./types";

export const loadState = async (path: string): Promise<StoredState> => {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return { seenIds: [] };
  }

  const raw = await file.text();
  const parsed = JSON.parse(raw) as StoredState;

  return {
    seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : []
  };
};

export const saveState = async (path: string, state: StoredState) => {
  const limited = {
    seenIds: state.seenIds.slice(0, 500)
  };

  await Bun.write(path, `${JSON.stringify(limited, null, 2)}\n`);
};
