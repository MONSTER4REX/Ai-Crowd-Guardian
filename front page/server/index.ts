import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Proxy API requests to FastAPI backend
  app.use("/api", async (req, res) => {
    try {
      const targetUrl = `http://localhost:8000${req.originalUrl}`;
      const options: RequestInit = {
        method: req.method,
        headers: req.headers as Record<string, string>,
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        options.body = req;
        (options as any).duplex = "half";
      }

      const response = await fetch(targetUrl, options);
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const bodyText = await response.text();
      res.send(bodyText);
    } catch (err: any) {
      console.error("Express API Proxy Error:", err);
      res.status(502).send("Proxy error: " + err.message);
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
