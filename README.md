# GitHub Channel Bot

Бот для Telegram-канала. Следит за публичной активностью GitHub и публикует новые push, release и создание репозиториев.

## Что нужно

- Bun
- Telegram-бот от BotFather
- бот добавлен в канал как админ
- канал указан как `@channel_username` или `-100...`

## Настройка

```powershell
copy .env.example .env
```

Заполни `.env`:

```env
GITHUB_USER=crysscoder
GITHUB_TOKEN=
TELEGRAM_BOT_TOKEN=token_from_botfather
TELEGRAM_CHAT_ID=@channel_username
POLL_INTERVAL_SECONDS=60
STARTUP_MODE=mark_seen
STATE_FILE=state.json
DRY_RUN=false
RUN_ONCE=false
```

`STARTUP_MODE=mark_seen` при первом запуске не публикует старые события.  
`STARTUP_MODE=publish_recent` опубликует свежие события из GitHub API.

## Запуск

```powershell
bun install
bun run start
```

## Проверка без отправки в канал

```powershell
$env:DRY_RUN="true"; $env:RUN_ONCE="true"; $env:STARTUP_MODE="publish_recent"; bun run start
```

## PM2

```powershell
pm2 start "bun run start" --name github-channel-bot
pm2 save
```
