require("dotenv").config();

const express = require("express");
const { loadRoutingConfig, resolveDiscordTarget } = require("./config");
const { sendToDiscord } = require("./discord");
const { buildDiscordMessage } = require("./formatter");
const { validateIncomingWebhook } = require("./validate");

const app = express();
const port = Number(process.env.PORT || 3000);
const routesFile = process.env.ROUTES_FILE || "./config/discord-routes.json";
const webhookSecret = process.env.WEBHOOK_SECRET || "";

let routingConfig = loadRoutingConfig(routesFile);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    routesFile: routingConfig.path,
  });
});

app.post("/webhooks/vamsys", async (req, res) => {
  if (webhookSecret) {
    const providedSecret = req.header("x-webhook-secret");

    if (providedSecret !== webhookSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  const errors = validateIncomingWebhook(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      ok: false,
      errors,
    });
  }

  const payload = req.body;
  const route = resolveDiscordTarget(routingConfig, payload.event);

  if (!route) {
    return res.status(202).json({
      ok: true,
      forwarded: false,
      reason: `No Discord webhook configured for event "${payload.event}"`,
    });
  }

  try {
    const message = buildDiscordMessage(payload, route);
    await sendToDiscord(route.webhookUrl, message);

    return res.status(200).json({
      ok: true,
      forwarded: true,
      event: payload.event,
    });
  } catch (error) {
    console.error("Failed to forward webhook", error);
    return res.status(502).json({
      ok: false,
      error: "Failed to deliver webhook to Discord",
    });
  }
});

app.post("/admin/reload-config", (_req, res) => {
  try {
    routingConfig = loadRoutingConfig(routesFile);
    return res.json({ ok: true, routesFile: routingConfig.path });
  } catch (error) {
    console.error("Failed to reload config", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`vamsys-webhookparser listening on port ${port}`);
});
