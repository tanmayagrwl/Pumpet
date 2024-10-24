import { Hono } from "hono";
import { handleOrgLogin, handleOrgSignup } from "../controller/auth.controller";
import {
	getJiraUser,
	handleJiraCallback,
	handleJiraSignup,
} from "../controller/jira.controller";

const authRouter = new Hono();

authRouter.post("/org/signup", handleOrgSignup);

authRouter.post("/org/login", handleOrgLogin);

authRouter.post("/jira/signup", handleJiraSignup);
authRouter.get("/jira/callback", handleJiraCallback);
authRouter.get("/jira/profile", getJiraUser);

export default authRouter;
