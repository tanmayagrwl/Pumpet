import { serve } from "@hono/node-server";
import { Hono } from "hono";
import CONFIG from "./utils/env";
import { BootstrapServer } from "./utils/server";

function main() {
  const app = new Hono();

  BootstrapServer(app);

  const port = Number(CONFIG.PORT);
  console.log(`Server is running on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}

main();
