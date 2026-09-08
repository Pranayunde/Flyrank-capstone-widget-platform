const https = require("https");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);

    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function getGeoFromProviderA(ip) {
  const url = `https://ipapi.co/${ip}/json/`;

  const data = await fetchJson(url);

  if (!data || data.error) {
    throw new Error("Provider A failed");
  }

  return {
    provider: "ipapi",
    country: data.country_name || null,
    city: data.city || null
  };
}

async function getGeoFromProviderB(ip) {
  const url = `https://ipwho.is/${ip}`;

  const data = await fetchJson(url);

  if (!data || data.success === false) {
    throw new Error("Provider B failed");
  }

  return {
    provider: "ipwho.is",
    country: data.country || null,
    city: data.city || null
  };
}

async function getGeoLocation(ip) {
  // Localhost cannot be meaningfully geolocated.
  if (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("::ffff:127.")
  ) {
    return null;
  }

  // Provider A
  try {
    return await getGeoFromProviderA(ip);
  } catch (error) {
    console.error(
      "Geo Provider A failed:",
      error.message
    );
  }

  // Provider B fallback
  try {
    return await getGeoFromProviderB(ip);
  } catch (error) {
    console.error(
      "Geo Provider B failed:",
      error.message
    );
  }

  // Both providers failed.
  // Submission still succeeds.
  return null;
}

module.exports = {
  getGeoLocation
};