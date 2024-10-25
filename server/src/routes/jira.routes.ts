import { Hono } from "hono";
import {
  getIssueTransitions,
  getAuditLogs,
  getJiraProjectIssues,
  getJiraUserProjects,
  getUserPointsPerProject,
  getDetailedAuditLogs,
} from "../controller/jira.controller";

const jiraRouter = new Hono();

jiraRouter.get("/projects", getJiraUserProjects);
jiraRouter.get(
  "/projects/:cloudId/project/:projectId/issues",
  getJiraProjectIssues,
);

jiraRouter.get(
  "/projects/:cloudId/issues/:issueKey/transitions",
  getIssueTransitions,
);
// jiraRouter.get("/projects/:id/issue/:issue_id/transition", getIssueTransitions);

jiraRouter.get("/projects/:id/audit", getAuditLogs);
jiraRouter.get("/projects/:id/audit/detail", getDetailedAuditLogs);

jiraRouter.get("/projects/:id/points", getUserPointsPerProject);

export default jiraRouter;
