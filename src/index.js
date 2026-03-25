require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const { loadEmbedConfig, loadRoutingConfig, resolveDiscordTarget } = require("./config");
const { sendToDiscord } = require("./discord");
const { buildDiscordMessage } = require("./formatter");
const { validateIncomingWebhook } = require("./validate");

const app = express();
const parsedPort = Number.parseInt(process.env.PORT || "", 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 3000;
const routesFile = process.env.ROUTES_FILE || "./config/discord-routes.json";
const embedConfigFile = process.env.EMBED_CONFIG_FILE || "./config/embed-config.json";
const webhookSecret = process.env.WEBHOOK_SECRET || "";
const logLevel = (process.env.LOG_LEVEL || "development").toLowerCase();

let routingConfig = loadRoutingConfig(routesFile);
let embedConfig = loadEmbedConfig(embedConfigFile);

if (process.env.PORT && !Number.isFinite(parsedPort)) {
  console.warn(`Invalid PORT "${process.env.PORT}" provided. Falling back to 3000.`);
}

function shouldLog() {
  return logLevel === "development";
}

function logInfo(message, metadata = {}) {
  if (!shouldLog()) {
    return;
  }

  console.log(message, metadata);
}

function logWarn(message, metadata = {}) {
  if (!shouldLog()) {
    return;
  }

  console.warn(message, metadata);
}

function secretsMatch(expectedSecret, providedSecret) {
  if (!expectedSecret || !providedSecret) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSecret, "utf8");
  const providedBuffer = Buffer.from(providedSecret, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

app.use((req, _res, next) => {
  logInfo("[request] Incoming HTTP request", {
    receivedAt: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    contentType: req.get("content-type") || "",
    userAgent: req.get("user-agent") || "",
  });
  next();
});

app.use(express.json({ limit: "1mb" }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    logWarn("[request] Invalid JSON payload received", {
      receivedAt: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      contentType: req.get("content-type") || "",
      error: error.message,
    });

    return res.status(400).json({
      ok: false,
      error: "Invalid JSON payload",
    });
  }

  return next(error);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    routesFile: routingConfig.path,
  });
});

app.post("/webhooks/vamsys", async (req, res) => {
  logInfo("[webhook] Incoming request received", {
    receivedAt: new Date().toISOString(),
    ip: req.ip,
  });

  if (webhookSecret) {
    const providedSecret = req.header("x-webhook-secret");

    if (!secretsMatch(webhookSecret, providedSecret)) {
      logWarn("[webhook] Rejected request with invalid secret", {
        receivedAt: new Date().toISOString(),
        ip: req.ip,
      });
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  const errors = validateIncomingWebhook(req.body);

  if (errors.length > 0) {
    logWarn("[webhook] Rejected invalid payload", {
      receivedAt: new Date().toISOString(),
      errors,
      body: req.body,
    });
    return res.status(400).json({
      ok: false,
      errors,
    });
  }

  const payload = req.body;
  logInfo("[webhook] Payload accepted", {
    event: payload.event,
    eventId: payload.event_id,
    airlineId: payload.airline_id,
    timestamp: payload.timestamp,
  });

  const route = resolveDiscordTarget(routingConfig, payload.event);

  if (!route) {
    logInfo("[webhook] No Discord route configured", {
      event: payload.event,
      eventId: payload.event_id,
    });
    return res.status(202).json({
      ok: true,
      forwarded: false,
      reason: `No Discord webhook configured for event "${payload.event}"`,
    });
  }

  try {
    const message = buildDiscordMessage(payload, route, embedConfig);
    logInfo("[webhook] Forwarding to Discord", {
      event: payload.event,
      eventId: payload.event_id,
      webhookConfigured: true,
    });
    await sendToDiscord(route.webhookUrl, message);
    logInfo("[webhook] Successfully forwarded to Discord", {
      event: payload.event,
      eventId: payload.event_id,
    });

    return res.status(200).json({
      ok: true,
      forwarded: true,
      event: payload.event,
    });
  } catch (error) {
    console.error("[webhook] Failed to forward to Discord", {
      event: payload.event,
      eventId: payload.event_id,
      error: error.message,
    });
    return res.status(502).json({
      ok: false,
      error: "Failed to deliver webhook to Discord",
    });
  }
});

app.listen(port, () => {
  console.log(`vamsys-webhookparser listening on port ${port} (log level: ${logLevel})`);
});
