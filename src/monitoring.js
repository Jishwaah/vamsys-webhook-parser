let sentry = null;
let sentryEnabled = false;

function initMonitoring(config = {}) {
  const dsn = config.dsn || "";

  if (!dsn) {
    return { enabled: false };
  }

  try {
    // Optional at runtime until dependencies are installed.
    sentry = require("@sentry/node");
    sentry.init({
      dsn,
      environment: config.environment || process.env.NODE_ENV || "production",
      release: config.release || undefined,
    });
    sentryEnabled = true;
    return { enabled: true };
  } catch (error) {
    console.warn("[monitoring] Failed to initialize Sentry", {
      error: error.message,
    });
    return { enabled: false };
  }
}

function captureException(error, context = {}) {
  if (!sentryEnabled || !sentry) {
    return;
  }

  sentry.captureException(error, context);
}

async function flushMonitoring(timeoutMs = 2000) {
  if (!sentryEnabled || !sentry) {
    return;
  }

  try {
    await sentry.flush(timeoutMs);
  } catch (_error) {
    // Best effort only.
  }
}

function isMonitoringEnabled() {
  return sentryEnabled;
}

module.exports = {
  captureException,
  flushMonitoring,
  initMonitoring,
  isMonitoringEnabled,
};
