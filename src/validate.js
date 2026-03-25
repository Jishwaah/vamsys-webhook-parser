function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateIncomingWebhook(payload) {
  const errors = [];

  if (!isObject(payload)) {
    return ["Request body must be a JSON object."];
  }

  if (typeof payload.event !== "string" || !payload.event) {
    errors.push('Missing or invalid "event".');
  }

  if (typeof payload.event_id !== "string" || !payload.event_id) {
    errors.push('Missing or invalid "event_id".');
  }

  if (typeof payload.timestamp !== "string" || !payload.timestamp) {
    errors.push('Missing or invalid "timestamp".');
  }

  if (typeof payload.airline_id !== "number") {
    errors.push('Missing or invalid "airline_id".');
  }

  if (!isObject(payload.data)) {
    errors.push('Missing or invalid "data".');
  }

  return errors;
}

module.exports = {
  validateIncomingWebhook,
};
