const fs = require("fs");
const path = require("path");

function loadRoutingConfig(routesFile) {
  const resolvedPath = path.resolve(routesFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Routing config not found at ${resolvedPath}. Copy config/discord-routes.example.json to config/discord-routes.json and update it.`,
    );
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Routing config must be a JSON object.");
  }

  if (!parsed.events || typeof parsed.events !== "object") {
    throw new Error('Routing config must include an "events" object.');
  }

  return {
    path: resolvedPath,
    defaultWebhookUrl:
      typeof parsed.defaultWebhookUrl === "string" ? parsed.defaultWebhookUrl : "",
    events: parsed.events,
  };
}

function resolveDiscordTarget(config, eventName) {
  const eventConfig = config.events[eventName];

  if (eventConfig && typeof eventConfig.webhookUrl === "string" && eventConfig.webhookUrl) {
    return eventConfig;
  }

  if (config.defaultWebhookUrl) {
    return {
      webhookUrl: config.defaultWebhookUrl,
      username: "VAMSYS Alerts",
    };
  }

  return null;
}

module.exports = {
  loadRoutingConfig,
  resolveDiscordTarget,
};
