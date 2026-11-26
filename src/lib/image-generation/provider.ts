if (typeof window !== "undefined") {
  throw new Error("image-generation/provider is server-only");
}

export type ImageGenerationResult =
  | { ok: true; buffer: Buffer; mimeType: string; provider: string }
  | { ok: false; error: string; provider: string };

export async function generateImageFromPrompt(
  prompt: string
): Promise<ImageGenerationResult> {
  const provider = (process.env.IMAGE_GENERATION_PROVIDER || "")
    .trim()
    .toLowerCase();
  const apiKey = (process.env.IMAGE_GENERATION_API_KEY || "").trim();

  if (!provider || !apiKey) {
    return {
      ok: false,
      provider: provider || "unconfigured",
      error:
        "Automatic AI image generation is not configured (IMAGE_GENERATION_PROVIDER and IMAGE_GENERATION_API_KEY are not set). A branded Vistara fallback image was applied.",
    };
  }

  if (provider === "openai") {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size: "1536x1024",
            quality: "medium",
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "OpenAI API error");
        return {
          ok: false,
          provider: "openai",
          error: `OpenAI image generation failed (${response.status}): ${errText.slice(0, 200)}`,
        };
      }

      const json = (await response.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
      };
      const first = json.data?.[0];
      if (first?.b64_json) {
        return {
          ok: true,
          buffer: Buffer.from(first.b64_json, "base64"),
          mimeType: "image/png",
          provider: "openai",
        };
      }
      if (first?.url) {
        const imgRes = await fetch(first.url);
        const arrBuf = await imgRes.arrayBuffer();
        return {
          ok: true,
          buffer: Buffer.from(arrBuf),
          mimeType: imgRes.headers.get("content-type") || "image/png",
          provider: "openai",
        };
      }

      return {
        ok: false,
        provider: "openai",
        error: "OpenAI did not return image data.",
      };
    } catch (err) {
      return {
        ok: false,
        provider: "openai",
        error:
          err instanceof Error ? err.message : "OpenAI request failed.",
      };
    }
  }

  if (provider === "gemini") {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "4:3",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "Gemini API error");
        return {
          ok: false,
          provider: "gemini",
          error: `Gemini image generation failed (${response.status}): ${errText.slice(0, 200)}`,
        };
      }

      const json = (await response.json()) as {
        predictions?: Array<{
          bytesBase64Encoded?: string;
          mimeType?: string;
        }>;
      };
      const pred = json.predictions?.[0];
      if (!pred?.bytesBase64Encoded) {
        return {
          ok: false,
          provider: "gemini",
          error: "Gemini Imagen did not return image bytes.",
        };
      }

      return {
        ok: true,
        buffer: Buffer.from(pred.bytesBase64Encoded, "base64"),
        mimeType: pred.mimeType || "image/png",
        provider: "gemini",
      };
    } catch (err) {
      return {
        ok: false,
        provider: "gemini",
        error: err instanceof Error ? err.message : "Gemini request failed.",
      };
    }
  }

  return {
    ok: false,
    provider,
    error: `Unsupported IMAGE_GENERATION_PROVIDER "${provider}". Supported providers: openai, gemini.`,
  };
}
