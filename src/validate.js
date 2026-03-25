function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function validateIncomingWebhook(payload) {
  const errors = [];

  if (!isObject(payload)) {
    return ["Request body must be a JSON object."];
  }

  if (!isNonEmptyString(payload.event)) {
    errors.push('Missing or invalid "event".');
  }

  if (!isNonEmptyString(payload.event_id)) {
    errors.push('Missing or invalid "event_id".');
  }

  if (!isNonEmptyString(payload.timestamp)) {
    errors.push('Missing or invalid "timestamp".');
  }

  if (!Number.isFinite(payload.airline_id)) {
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
