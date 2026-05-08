import { Hono } from "hono";
import { updatePrices } from "../services/price-store";

const app = new Hono();

app.get("/api/cron/update-prices", async (c) => {
  const authHeader = c.req.header("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  console.log("[Cron] Starting daily price update...");
  const result = await updatePrices();
  console.log("[Cron] Update result:", result);

  return c.json(result);
});

export default app;
