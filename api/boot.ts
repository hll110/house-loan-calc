import app from "./app";
import { env } from "./lib/env";

export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const cron = await import("node-cron");
  const { updatePrices } = await import("./services/price-store");

  cron.default.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running daily price update at midnight...");
    const result = await updatePrices();
    console.log("[Cron] Result:", result);
  });
  console.log("[Cron] Scheduled daily price update at 00:00");

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
