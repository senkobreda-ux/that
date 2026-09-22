const DISCORD_API =
  "https://discord.com/api/v10";


export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS"
  };


  /* =======================================================
     CORS
     ======================================================= */

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }


  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Use POST."
      }),
      {
        status: 405,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json"
        }
      }
    );
  }


  try {
    const body =
      await req.json();


    const path =
      body.path;

    const method =
      String(
        body.method || "GET"
      ).toUpperCase();


    if (
      typeof path !== "string" ||
      !path.startsWith("/")
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid Discord API path."
        }),
        {
          status: 400,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json"
          }
        }
      );
    }


    const token =
      process.env.DISCORD_BOT_TOKEN;


    if (!token) {
      throw new Error(
        "DISCORD_BOT_TOKEN is not configured."
      );
    }


    const url =
      DISCORD_API + path;


    const headers = {
      "Authorization":
        "Bot " + token,

      "User-Agent":
        "DiscordBot (Custom Client, 1.0)"
    };


    /* =====================================================
       NORMAL JSON REQUEST
       ===================================================== */

    if (!body.files) {
      if (
        body.payload !== undefined &&
        method !== "GET"
      ) {
        headers["Content-Type"] =
          "application/json";
      }


      const options = {
        method,
        headers
      };


      if (
        body.payload !== undefined &&
        method !== "GET"
      ) {
        options.body =
          JSON.stringify(
            body.payload
          );
      }


      const discordResponse =
        await fetch(
          url,
          options
        );


      const text =
        await discordResponse.text();


      return new Response(
        text,
        {
          status:
            discordResponse.status,

          headers: {
            ...corsHeaders,

            "Content-Type":
              discordResponse
                .headers
                .get("content-type") ||
              "application/json"
          }
        }
      );
    }


    /* =====================================================
       FILE UPLOAD
       ===================================================== */

    const form =
      new FormData();


    if (body.payload) {
      form.append(
        "payload_json",
        JSON.stringify(
          body.payload
        )
      );
    }


    for (
      let i = 0;
      i < body.files.length;
      i++
    ) {
      const file =
        body.files[i];


      if (
        !file ||
        !file.data
      ) {
        continue;
      }


      /*
       * Convert base64 into bytes.
       */

      const base64 =
        file.data.includes(",")
          ? file.data.split(",")[1]
          : file.data;


      const binary =
        Buffer.from(
          base64,
          "base64"
        );


      const blob =
        new Blob(
          [binary],
          {
            type:
              file.type ||
              "application/octet-stream"
          }
        );


      form.append(
        `files[${i}]`,
        blob,
        file.name ||
          `file-${i}`
      );
    }


    const discordResponse =
      await fetch(
        url,
        {
          method,
          headers,
          body: form
        }
      );


    const text =
      await discordResponse.text();


    return new Response(
      text,
      {
        status:
          discordResponse.status,

        headers: {
          ...corsHeaders,

          "Content-Type":
            discordResponse
              .headers
              .get("content-type") ||
            "application/json"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          String(error)
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,

          "Content-Type":
            "application/json"
        }
      }
    );
  }
}


export const config = {
  path: "/api/discord"
};

