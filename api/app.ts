import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import cronApp from "./cron/update-prices";

const app = new Hono<{ Bindings: HttpBindings }>();

app.onError((err, c) => {
  console.error("[App] Unhandled error:", err.message, err.stack);
  return c.json({ error: err.message }, 500);
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.route("/", cronApp);

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
