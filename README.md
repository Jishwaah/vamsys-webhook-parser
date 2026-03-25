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
3. Copy `config/embed-config.example.json` to `config/embed-config.json` if you want editable embed colors
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

If an event is not configured and `defaultWebhookUrl` is empty, the service accepts the request but does not forward it.

## Embed colors

Embed colors are now configured in `config/embed-config.json`.

Example:

```json
{
  "defaultColor": "#f1c40f",
  "actionColors": {
    "created": "#2ecc71",
    "updated": "#3498db",
    "deleted": "#e74c3c",
    "accepted": "#2ecc71",
    "rejected": "#e74c3c"
  },
  "eventColors": {
    "notam.created": "#1abc9c",
    "alert.created": "#f39c12"
  }
}
```

Color lookup order is:

- exact event match from `eventColors`
- action match from `actionColors` using the part after the first dot, for example `pilot.registered` -> `registered` and `pirep.need_reply` -> `need_reply`
- `defaultColor`

## Endpoints

- `POST /webhooks/vamsys`
- `GET /health`
- `POST /admin/reload-config`

If `WEBHOOK_SECRET` is set, the incoming request must include `x-webhook-secret`.

## Run

```bash
npm install
npm run dev
```

## Notes

- Node.js 18+ is required because the app uses native `fetch`.
- The first formatter is generic and works from top-level/nested scalar values in `data`.
- Once you have the exact event schemas, the embed formatter can be upgraded to produce cleaner event-specific Discord messages.
