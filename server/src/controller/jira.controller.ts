import type { Context } from "hono";
import { ulid } from "ulid";
import { cache } from "../db/cache";
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
	const scopes = config.scope.join(" ");
	const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${config.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&prompt=consent`;

	console.log(authUrl);

	return c.json({
		success: true,
		message: "Redirecting to Jira for authentication",
		data: { authUrl },
	});
};

export const handleJiraCallback = async (c: Context) => {
	const code = c.req.query("code");

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

	console.log(response);

	if (response.status !== 200) {
		throw new BackendError("INTERNAL_ERROR", {
			details: "Failed to fetch Jira user profile",
		});
	}

	const data = await response.json();

	console.log(data);

	return c.json({
		success: true,
		message: "Successfully retrieved Jira user profile",
		data,
	});
};

/*
eyJraWQiOiJhdXRoLmF0bGFzc2lhbi5jb20tQUNDRVNTLWE5Njg0YTZlLTY4MjctNGQ1Yi05MzhjLWJkOTZjYzBiOTk0ZCIsImFsZyI6IlJTMjU2In0.eyJqdGkiOiJmYjEzYjNjMi1iNTg2LTRkYWItYjgyZC03MWMzM2IyNjExN2IiLCJzdWIiOiI3MTIwMjA6YTkwOTIyMWYtNWU0NS00Y2U2LWJkZDQtZmM4ZGVmNjZjOGEzIiwibmJmIjoxNzI5NzY5NTQ2LCJpc3MiOiJodHRwczovL2F1dGguYXRsYXNzaWFuLmNvbSIsImlhdCI6MTcyOTc2OTU0NiwiZXhwIjoxNzI5NzczMTQ2LCJhdWQiOiJ4U2dxT1g5MTBxYlRpNlJrV0ZMWHpEd0pOT0x1dXppcyIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS9zeXN0ZW1BY2NvdW50SWQiOiI3MTIwMjA6NjI3OGRhZGItNTExOS00MDg3LWFkOWYtODdhYzk2ZGM4ZWY3Iiwic2NvcGUiOiJtYW5hZ2U6amlyYS1wcm9qZWN0IHJlYWQ6amlyYS13b3JrIG1hbmFnZTpqaXJhLXdlYmhvb2sgcmVhZDpqaXJhLXVzZXIiLCJjbGllbnRfaWQiOiJ4U2dxT1g5MTBxYlRpNlJrV0ZMWHpEd0pOT0x1dXppcyIsImh0dHBzOi8vaWQuYXRsYXNzaWFuLmNvbS9zZXNzaW9uX2lkIjoiMjliYmI0ZjQtZTUyYi00NzkxLWIwYzQtMTU0Y2FlZmVkNDQ3IiwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL3N5c3RlbUFjY291bnRFbWFpbCI6IjgwZjA4MTllLTRlZDEtNDM0OS04OWI3LWYyZTQ5ZDFlYWY4MUBjb25uZWN0LmF0bGFzc2lhbi5jb20iLCJodHRwczovL2lkLmF0bGFzc2lhbi5jb20vYXRsX3Rva2VuX3R5cGUiOiJBQ0NFU1MiLCJodHRwczovL2F0bGFzc2lhbi5jb20vZmlyc3RQYXJ0eSI6ZmFsc2UsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS92ZXJpZmllZCI6dHJ1ZSwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL3VqdCI6Ijg1NjJhYmU0LWQ4MDktNGVmMS1hNGJlLWE5M2ZhZDQ4NTg1ZSIsImh0dHBzOi8vaWQuYXRsYXNzaWFuLmNvbS9wcm9jZXNzUmVnaW9uIjoidXMtZWFzdC0xIiwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL29hdXRoQ2xpZW50SWQiOiJ4U2dxT1g5MTBxYlRpNlJrV0ZMWHpEd0pOT0x1dXppcyIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS9lbWFpbERvbWFpbiI6ImdtYWlsLmNvbSIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS8zbG8iOnRydWUsImh0dHBzOi8vaWQuYXRsYXNzaWFuLmNvbS92ZXJpZmllZCI6dHJ1ZSwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL3N5c3RlbUFjY291bnRFbWFpbERvbWFpbiI6ImNvbm5lY3QuYXRsYXNzaWFuLmNvbSJ9.PnLyKuZWqBa501VJjiIt2R0GrXdQbSlnsLZSeKNHln_5Yl4fiPWtRJ-jtaahkf7YaEyT6YxgxpV1IK3Hu7Nm6DMKB8lFEUT-eBlftqb857XOMa3qkdGSUUGbY3ftZnebonKrdC0ZVo9jjc3BmldkcRZieA52HM0eGeHudTKs7G6ycRp6LF518NWAoxH1nDievMhLcOqHCTxHBReVi7sD7MbcAgxtOXJtBfyzk9ts5CiwxW77rINUdikxmtf35lTPWE5i0R8Vk6jVPnjeSzfJSw6-AbbQ4woZ9z79YKCLHF0Q2WLWaPgDocedVchMaoV7taVv5O9DdCc-RvtgZ9z3eA"

*/
