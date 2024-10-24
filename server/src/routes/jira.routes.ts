import { Hono } from "hono";
import {
	getJiraIssueByID,
	getJiraProjectByID,
	getJiraProjectIssues,
	getJiraUser,
	getJiraUserProjects,
	handleJiraCallback,
} from "../controller/jira.controller";

const jiraRouter = new Hono();

jiraRouter.get("/projects", getJiraUserProjects);
jiraRouter.get("/projects/:id", getJiraProjectByID);
jiraRouter.get("/projects/:id/issue", getJiraProjectIssues);
jiraRouter.get("/projects/:id/issue/:ticketId", getJiraIssueByID);

export default jiraRouter;
