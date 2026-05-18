<div align="center">

# GitHub Channel Bot

![Release](https://img.shields.io/github/v/release/crysscoder/github-channel-bot?style=flat-square&label=release)
![Bun](https://img.shields.io/badge/Bun-runtime-000000?style=flat-square&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-channel-26A5E4?style=flat-square&logo=telegram&logoColor=white)
![Issues](https://img.shields.io/github/issues/crysscoder/github-channel-bot?style=flat-square)

Telegram-бот для публикации GitHub-активности в канал.

[Release](https://github.com/crysscoder/github-channel-bot/releases/latest) · [Issues](https://github.com/crysscoder/github-channel-bot/issues) · [CodeAdapter](https://codeadapter.ru)

</div>

## Что делает

- публикует новые push
- публикует новые release
- публикует создание новых репозиториев
- работает через GitHub public events
- хранит уже обработанные события в `state.json`

## Настройка

Создай `.env`:

```env
GITHUB_USER=crysscoder
GITHUB_TOKEN=
TELEGRAM_BOT_TOKEN=token
TELEGRAM_CHAT_ID=-1000000000000
POLL_INTERVAL_SECONDS=60
STARTUP_MODE=mark_seen
STATE_FILE=state.json
DRY_RUN=false
RUN_ONCE=false
```

`STARTUP_MODE=mark_seen` при первом запуске просто запоминает старые события.  
`STARTUP_MODE=publish_recent` отправит свежие события из GitHub API.

## Запуск

```powershell
bun install
bun run start
```

## Проверка без отправки

```powershell
$env:DRY_RUN="true"; $env:RUN_ONCE="true"; $env:STARTUP_MODE="publish_recent"; bun run start
```

## PM2

```powershell
pm2 start "bun run start" --name github-channel-bot
pm2 save
```
