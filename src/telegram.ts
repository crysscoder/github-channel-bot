import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Config } from "./config";

type Payload = {
  chat_id: string;
  text: string;
  parse_mode: "HTML";
  disable_web_page_preview: boolean;
};

const createPayload = (config: Config, text: string): Payload => ({
  chat_id: config.telegramChatId,
  text,
  parse_mode: "HTML",
  disable_web_page_preview: true
});

const sendWithFetch = async (config: Config, payload: Payload) => {
  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${response.status}: ${body}`);
  }
};

const sendWithPowerShell = async (config: Config, payload: Payload) => {
  const payloadPath = join(tmpdir(), `github-channel-bot-${crypto.randomUUID()}.json`);
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName System.Net.Http",
    "$client = [System.Net.Http.HttpClient]::new()",
    "$json = [System.IO.File]::ReadAllText($env:TG_PAYLOAD, [System.Text.Encoding]::UTF8)",
    "$content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')",
    "$res = $client.PostAsync(('https://api.telegram.org/bot' + $env:TG_TOKEN + '/sendMessage'), $content).GetAwaiter().GetResult()",
    "$body = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()",
    "if (-not $res.IsSuccessStatusCode) { throw $body }",
    "Write-Output $body"
  ].join("; ");

  await Bun.write(payloadPath, JSON.stringify(payload));

  try {
    const proc = Bun.spawn([
      "powershell.exe",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script
    ], {
      env: {
        ...process.env,
        TG_TOKEN: config.telegramBotToken,
        TG_PAYLOAD: payloadPath
      },
      stdout: "pipe",
      stderr: "pipe"
    });

    const [exitCode, stdout, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text()
    ]);

    if (exitCode !== 0) {
      throw new Error(stderr || stdout || `PowerShell exited with ${exitCode}`);
    }
  } finally {
    await Bun.file(payloadPath).delete().catch(() => {});
  }
};

export const sendTelegramMessage = async (config: Config, text: string) => {
  if (config.dryRun) {
    console.log(text);
    return;
  }

  const payload = createPayload(config, text);

  if (process.platform === "win32") {
    await sendWithPowerShell(config, payload);
    return;
  }

  await sendWithFetch(config, payload);
};
