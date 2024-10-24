import { Hono } from "hono";
import authRouter from "./auth.routes";
import jiraRouter from "./jira.routes";

const appRouter = new Hono();

appRouter.get("/", (c) => {
	return c.text("Hello World!");
});

appRouter.route("/auth", authRouter);
appRouter.route("/jira", jiraRouter);

export default appRouter;
