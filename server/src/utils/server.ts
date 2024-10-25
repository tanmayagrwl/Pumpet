import type { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import appRouter from "../routes";
import { errorHandler } from "./errors";

export async function BootstrapServer(app: Hono) {
  // app.use(cors());
  // app.use("*", cors());
  // app.use("*", async (c, next) => {
  //   // Skip CSRF for webhook endpoints
  //   if (c.req.path.includes("/webhook")) {
  //     return next();
  //   }
  //   // Apply CSRF for all other routes
  //   return csrf()(c, next);
  // });
  // app.use(csrf());
  // app.use(secureHeaders());
  app.notFound((c: Context) => {
    return c.json({
      success: false,
      message: "Route Not Found",
    });
  });

  app.route("/api/v1", appRouter);

  app.onError((err: Error, c: Context) => {
    return errorHandler(err, c);
  });
}
