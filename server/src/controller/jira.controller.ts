import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import db from "../db/db";
import type { userType } from "../types/user";
import ENV from "../utils/env";
import { BackendError } from "../utils/errors";

const config = {
	clientId: ENV.JIRA_CLIENT_ID,
	clientSecret: ENV.JIRA_CLIENT_SECRET,
	redirectUri: "http://localhost:5050/api/v1/auth/jira/callback",

	scope: [
		"read:jira-user",
		"read:jira-work",
		"manage:jira-project",
		"manage:jira-webhook",
		"offline_access",
		"read:me",
	],
};

export const handleJiraSignup = async (c: Context) => {
	const redirectParam = c.req.query("r");
	const scopes = config.scope.join(" ");
	const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${config.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&prompt=consent&state=${redirectParam === "1" ? "redirect" : ""}`;

	console.log(authUrl);

	return c.json({
		success: true,
		message: "Redirecting to Jira for authentication",
		data: { authUrl },
	});
};

export const handleJiraCallback = async (c: Context) => {
	const code = c.req.query("code");
	const state = c.req.query("state");

	if (!code) {
		throw new BackendError("BAD_REQUEST", {
			details: "Missing code or state parameter",
		});
	}

	const response = await fetch("https://auth.atlassian.com/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			grant_type: "authorization_code",
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code: code,
			redirect_uri: config.redirectUri,
		}),
	});

	if (!response.ok) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to exchange authorization code for access token",
		});
	}

	const data = await response.json();

	if (state === "redirect") {
		setCookie(c, "jira_access_token", data.access_token);
		setCookie(c, "jira_refresh_token", data.refresh_token);
		return c.redirect("http://localhost:3000");
	}

	return c.json({
		success: true,
		message: "Successfully authenticated with Jira",
		data: {
			access_token: data.access_token,
			expires_in: data.expires_in,
			scope: data.scope,
			...data,
		},
	});
};

export const getJiraUser = async (c: Context) => {
	const token = c.req.header("Authorization");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	if (!token.startsWith("Bearer ")) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Invalid Authorization header",
		});
	}

	console.trace(token);

	const response = await fetch("https://api.atlassian.com/me", {
		method: "GET",
		headers: {
			Authorization: `${token}`,
			Accept: "application/json",
		},
	});

	if (response.status !== 200) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch Jira user profile",
		});
	}

	const data = await response.json();

	const result = await (await db()).collection("users").insertOne(data);

	if (!result.insertedId) {
		throw new BackendError("INTERNAL_ERROR", {
			message: "Error saving user data",
		});
	}

	return c.json({
		success: true,
		message: "Successfully retrieved Jira user profile",
		data,
	});
};

export const getJiraUserProjects = async (c: Context) => {
	const token = c.req.header("Authorization");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	const response = await fetch(
		"https://api.atlassian.com/ex/jira/rest/api/latest/project",
		{
			method: "GET",
			headers: {
				Authorization: token,
				Accept: "application/json",
			},
		},
	);

	console.log(response);

	if (!response.ok) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch Jira projects",
		});
	}

	const data = await response.json();

	return c.json({
		success: true,
		message: "Successfully retrieved Jira projects",
		data,
	});
};

export const getJiraProjectByID = async (c: Context) => {
	const token = c.req.header("Authorization");
	const projectId = c.req.param("id");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	if (!projectId) {
		throw new BackendError("BAD_REQUEST", {
			details: "Missing project ID",
		});
	}

	const response = await fetch(
		`https://api.atlassian.com/ex/jira/rest/api/latest/project/${projectId}`,
		{
			method: "GET",
			headers: {
				Authorization: token,
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch Jira project",
		});
	}

	const data = await response.json();

	return c.json({
		success: true,
		message: "Successfully retrieved Jira project",
		data,
	});
};

export const getJiraProjectIssues = async (c: Context) => {
	const token = c.req.header("Authorization");
	const projectId = c.req.param("id");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	if (!projectId) {
		throw new BackendError("BAD_REQUEST", {
			details: "Missing project ID",
		});
	}

	const searchJql = `project=${projectId}`;

	const response = await fetch(
		`https://api.atlassian.com/ex/jira/rest/api/latest/search?jql=${encodeURIComponent(searchJql)}`,
		{
			method: "GET",
			headers: {
				Authorization: token,
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch project issues",
		});
	}

	const data = await response.json();

	return c.json({
		success: true,
		message: "Successfully retrieved project issues",
		data,
	});
};

export const getJiraIssueByID = async (c: Context) => {
	const token = c.req.header("Authorization");
	const issueId = c.req.param("id");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	if (!issueId) {
		throw new BackendError("BAD_REQUEST", {
			details: "Missing issue ID",
		});
	}

	const response = await fetch(
		`https://api.atlassian.com/ex/jira/rest/api/latest/issue/${issueId}`,
		{
			method: "GET",
			headers: {
				Authorization: token,
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch issue",
		});
	}

	const data = await response.json();

	return c.json({
		success: true,
		message: "Successfully retrieved issue",
		data,
	});
};
