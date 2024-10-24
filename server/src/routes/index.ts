import { Hono } from "hono";
import authRouter from "./auth.routes";

const appRouter = new Hono();

appRouter.get("/", (c) => {
  return c.text("Hello World!");
});

appRouter.route("/auth", authRouter);

export default appRouter;
