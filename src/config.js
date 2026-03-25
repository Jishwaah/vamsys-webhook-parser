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

function normalizeColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();

  if (/^#?[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.startsWith("#") ? normalized.toLowerCase() : `#${normalized.toLowerCase()}`;
  }

  return fallback;
}

function loadEmbedConfig(embedConfigFile) {
  const resolvedPath = path.resolve(embedConfigFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Embed config not found at ${resolvedPath}. Copy config/embed-config.example.json to config/embed-config.json and update it.`,
    );
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Embed config must be a JSON object.");
  }

  const actionColors = {};
  const eventColors = {};

  if (parsed.actionColors && typeof parsed.actionColors === "object") {
    for (const [key, value] of Object.entries(parsed.actionColors)) {
      actionColors[key] = normalizeColor(value, "#f1c40f");
    }
  }

  if (parsed.eventColors && typeof parsed.eventColors === "object") {
    for (const [key, value] of Object.entries(parsed.eventColors)) {
      eventColors[key] = normalizeColor(value, "#f1c40f");
    }
  }

  return {
    path: resolvedPath,
    defaultColor: normalizeColor(parsed.defaultColor, "#f1c40f"),
    actionColors,
    eventColors,
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
  loadEmbedConfig,
  loadRoutingConfig,
  resolveDiscordTarget,
};
