/*
|--------------------------------------------------------------------------
| Generic JSON Fetch
|--------------------------------------------------------------------------
*/
async function fetchJson(url) {

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      5000
    );


  try {

    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          headers: {
            Accept:
              "application/json"
          }
        }
      );


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    return await response.json();

  } catch (error) {

    if (
      error.name ===
      "AbortError"
    ) {
      throw new Error(
        "Request timeout"
      );
    }

    throw error;

  } finally {

    clearTimeout(
      timeout
    );
  }
}


/*
|--------------------------------------------------------------------------
| Provider A
|--------------------------------------------------------------------------
| ip-api.com
|--------------------------------------------------------------------------
*/
async function getGeoFromProviderA(
  ip
) {

  if (
    process.env.GEO_PROVIDER_A_MODE ===
    "fail"
  ) {
    throw new Error(
      "Provider A simulated failure"
    );
  }


  const url =
    `http://ip-api.com/json/${encodeURIComponent(
      ip
    )}?fields=status,country,city,message`;


  const data =
    await fetchJson(url);


  if (
    !data ||
    data.status !==
      "success"
  ) {
    throw new Error(
      data?.message ||
      "Provider A failed"
    );
  }


  return {
    provider:
      "ip-api.com",

    country:
      data.country ||
      null,

    city:
      data.city ||
      null
  };
}


/*
|--------------------------------------------------------------------------
| Provider B
|--------------------------------------------------------------------------
| ipapi.co
|--------------------------------------------------------------------------
*/
async function getGeoFromProviderB(
  ip
) {

  if (
    process.env.GEO_PROVIDER_B_MODE ===
    "fail"
  ) {
    throw new Error(
      "Provider B simulated failure"
    );
  }


  const url =
    `https://ipapi.co/${encodeURIComponent(
      ip
    )}/json/`;


  const data =
    await fetchJson(url);


  if (
    !data ||
    data.error
  ) {
    throw new Error(
      "Provider B failed"
    );
  }


  return {
    provider:
      "ipapi.co",

    country:
      data.country_name ||
      null,

    city:
      data.city ||
      null
  };
}


/*
|--------------------------------------------------------------------------
| Provider Fallback Chain
|--------------------------------------------------------------------------
|
| Provider A
|     ↓ fails
| Provider B
|     ↓ fails
| Store submission without geo
|
|--------------------------------------------------------------------------
*/
async function getGeoLocation(ip) {

  /*
  |--------------------------------------------------------------------------
  | Localhost has no useful public geo location.
  |--------------------------------------------------------------------------
  */
  if (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith(
      "::ffff:127."
    )
  ) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | Provider A
  |--------------------------------------------------------------------------
  */
  try {

    return await getGeoFromProviderA(
      ip
    );

  } catch (error) {

    console.error(
      "Geo Provider A failed:",
      error.message
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Provider B
  |--------------------------------------------------------------------------
  */
  try {

    return await getGeoFromProviderB(
      ip
    );

  } catch (error) {

    console.error(
      "Geo Provider B failed:",
      error.message
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Graceful degradation
  |--------------------------------------------------------------------------
  */
  return null;
}


module.exports = {
  getGeoLocation,
  getGeoFromProviderA,
  getGeoFromProviderB
};