import express from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import process from "node:process";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const app = express();
const httpServer = createServer(app);

// Extend http.IncomingMessage to include rawBody
// Note: In plain JS, we attach rawBody directly without declaration

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        if (path === "/api/discord-proxy") {
          const summary =
            typeof capturedJsonResponse === "object" && capturedJsonResponse !== null
              ? {
                  ok: res.statusCode < 400,
                  keys: Object.keys(capturedJsonResponse).slice(0, 8),
                }
              : { ok: res.statusCode < 400 };
          logLine += ` :: ${JSON.stringify(summary)}`;
        } else {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Railway uses PORT (default 8080), Cloudflare Pages uses PORT (default 8788)
  // Default to 5000 if not specified for local development
  const port = Number.parseInt(process.env.PORT || process.env.CF_PORTS || "5000", 10);
  
  // For Cloudflare Pages, also check for VCAP_APP_PORT (Cloud Foundry)
  const cloudflarePort = parseInt(process.env.PORT || "8788", 10);
  const finalPort = process.env.CF_PAGES ? cloudflarePort : port;
  
  httpServer.listen(
    {
      port: finalPort,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${finalPort}`);
    },
  );
})();
