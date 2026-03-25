const MAX_FIELD_VALUE = 1024;
const MAX_FIELDS = 12;

function titleFromEvent(eventName) {
  return eventName
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hexColorToDecimal(color) {
  return Number.parseInt(color.replace(/^#/, ""), 16);
}

function colorFromEvent(eventName, embedConfig) {
  const eventColor = embedConfig.eventColors[eventName];

  if (eventColor) {
    return hexColorToDecimal(eventColor);
  }

  const eventParts = eventName.split(".");
  const actionKey = eventParts.slice(1).join(".");
  const actionColor = embedConfig.actionColors[actionKey];

  if (actionColor) {
    return hexColorToDecimal(actionColor);
  }

  return hexColorToDecimal(embedConfig.defaultColor);
}

function flattenScalars(input, prefix = "", output = []) {
  if (!input || typeof input !== "object") {
    return output;
  }

  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      output.push([path, "null"]);
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        output.push([path, "[]"]);
        continue;
      }

      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          flattenScalars(item, `${path}[${index}]`, output);
        } else {
          output.push([`${path}[${index}]`, String(item)]);
        }
      });

      continue;
    }

    if (typeof value === "object") {
      flattenScalars(value, path, output);
      continue;
    }

    output.push([path, String(value)]);
  }

  return output;
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function buildFields(payload) {
  const baseFields = [
    {
      name: "Event ID",
      value: truncate(payload.event_id, MAX_FIELD_VALUE),
      inline: true,
    },
    {
      name: "Airline ID",
      value: String(payload.airline_id),
      inline: true,
    },
    {
      name: "Timestamp",
      value: payload.timestamp,
      inline: false,
    },
  ];

  const scalarFields = flattenScalars(payload.data)
    .slice(0, MAX_FIELDS - baseFields.length)
    .map(([key, value]) => ({
      name: truncate(key, 256),
      value: truncate(value || " ", MAX_FIELD_VALUE),
      inline: true,
    }));

  return [...baseFields, ...scalarFields];
}

function buildDiscordMessage(payload, route, embedConfig) {
  const embed = {
    title: titleFromEvent(payload.event),
    description: `Incoming \`${payload.event}\` webhook received and processed.`,
    color: colorFromEvent(payload.event, embedConfig),
    timestamp: payload.timestamp,
    fields: buildFields(payload),
    footer: {
      text: "vamsys-webhookparser",
    },
  };

  return {
    username: route.username || "VAMSYS Alerts",
    embeds: [embed],
  };
}

module.exports = {
  buildDiscordMessage,
};
