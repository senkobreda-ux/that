const DISCORD_API = "https://discord.com/api/v10";

export default async function handler(req) {
  // Allow the GAS web app to call this function.
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  // Browser CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Use POST."
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = await req.json();

    const path = body.path;
    const method = String(body.method || "GET").toUpperCase();
    const payload = body.payload;

    if (
      typeof path !== "string" ||
      !path.startsWith("/")
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid Discord API path."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Don't allow arbitrary external URLs.
    const url = DISCORD_API + path;

    const headers = {
      "Authorization": "Bot " + process.env.DISCORD_BOT_TOKEN,
      "User-Agent": "DiscordBot (GAS Client, 1.0)"
    };

    const options = {
      method,
      headers
    };

    if (payload !== undefined && method !== "GET") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    const discordResponse = await fetch(url, options);

    const text = await discordResponse.text();

    return new Response(text, {
      status: discordResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          discordResponse.headers.get("content-type") ||
          "application/json"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
}

export const config = {
  path: "/api/discord"
};