import express from "express";
import serverless from "serverless-http";
import cors from "cors";

const app = express();
app.use((req, res, next) => {
  console.log("Express method:", req.method);
  console.log("Express URL:", req.url);
  console.log("Express path:", req.path);
  next();
});

app.use(
  cors({
    origin: "http://localhost:5174",
  }),
);

app.use(express.json());

app.post(["/gemini", "/api/gemini"], async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "A valid prompt is required.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is missing.",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const data = await response.json();

    console.log("Gemini status:", response.status);

    if (!response.ok) {
      console.error("Gemini error:", data.error);

      return res.status(response.status).json({
        error: data.error?.message || "Gemini request failed.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Backend error:", error);

    return res.status(500).json({
      error: "Something went wrong.",
    });
  }
});

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
