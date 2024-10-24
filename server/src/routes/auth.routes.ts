import { Hono } from "hono";
import { handleOrgSignup, handleOrgLogin } from "../controller/auth.controller";
const authRouter = new Hono();

authRouter.post("/org/signup", handleOrgSignup);

authRouter.post("/org/login", handleOrgLogin);

export default authRouter;
