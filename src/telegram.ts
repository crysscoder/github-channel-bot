import type { Config } from "./config";

export const sendTelegramMessage = async (config: Config, text: string) => {
  if (config.dryRun) {
    console.log(text);
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${response.status}: ${body}`);
  }
};
