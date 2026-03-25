async function sendToDiscord(webhookUrl, message) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Discord webhook request failed (${response.status}): ${responseText}`);
  }
}

module.exports = {
  sendToDiscord,
};
