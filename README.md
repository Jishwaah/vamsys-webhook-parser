# vamsys-webhookparser

Small Node.js service that receives incoming webhook events, validates the shared envelope, routes each event to a configured Discord webhook, and sends a formatted Discord embed.

## Incoming schema

```json
{
  "event": "pilot.registered",
  "event_id": "evt_wL5zqNECyp",
  "timestamp": "2026-03-25T17:16:31+00:00",
  "airline_id": 123,
  "data": {}
}
```

## Configuration

1. Copy `.env.example` to `.env`
2. Copy `config/discord-routes.example.json` to `config/discord-routes.json`
3. Copy `config/embed-config.example.json` to `config/embed-config.json`
4. Set a Discord webhook URL for each event you want to forward

Example routing file:

```json
{
  "defaultWebhookUrl": "",
  "events": {
    "pilot.registered": {
      "webhookUrl": "https://discord.com/api/webhooks/your/webhook",
      "username": "VAMSYS Alerts"
    },
    "flight.completed": {
      "webhookUrl": "https://discord.com/api/webhooks/another/webhook",
      "username": "Flight Notifications"
    }
  }
}
```

All routings in the `discord-routes.json` file are optional. You can configure as many or as few events as you like. This allows you to specify custom overrides for certain events while using `defaultWebhookUrl` for the rest.

If an event is not configured and `defaultWebhookUrl` is empty, the service accepts the request but does not forward it to Discord.

**All changes to configuration files require the application to be restarted to take effect.**

## Endpoints

- `POST /webhooks/vamsys`
- `GET /health`

If `WEBHOOK_SECRET` is set, the incoming request must include `x-webhook-secret`. You may need to configure this as a custom header in your vAMSYS webhook settings.

## Run

```bash
npm install
npm run start
```

## Notes

- Node.js 18.11.0+ is required because the app uses native `fetch` and the dev script uses `node --watch`.
- The first formatter is generic and works from top-level/nested scalar values in `data`.
- Once you have the exact event schemas, the embed formatter can be upgraded to produce cleaner event-specific Discord messages.
