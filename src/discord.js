const DISCORD_REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRetryDelay(attempt) {
  const exponentialDelay = BASE_RETRY_DELAY_MS * (2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return exponentialDelay + jitter;
}

async function postDiscordWebhook(webhookUrl, message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DISCORD_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Discord webhook request timed out after ${DISCORD_REQUEST_TIMEOUT_MS}ms`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendToDiscord(webhookUrl, message) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await postDiscordWebhook(webhookUrl, message);

    if (response.ok) {
      return;
    }

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterSeconds = Number.parseFloat(response.headers.get("Retry-After") || "");
      const retryDelayMs = Number.isFinite(retryAfterSeconds)
        ? Math.ceil(retryAfterSeconds * 1000)
        : getRetryDelay(attempt);
      await sleep(retryDelayMs);
      continue;
    }

    const responseText = await response.text();
    throw new Error(`Discord webhook request failed (${response.status}): ${responseText}`);
  }
}

module.exports = {
  sendToDiscord,
};
