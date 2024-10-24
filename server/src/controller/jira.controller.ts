import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { jwtDecode } from "jwt-decode";
import { cache } from "../db/cache";
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

	const decodedToken = jwtDecode(token.replace("Bearer ", ""));
	const userId = decodedToken.sub;

	const cacheKey = `jira:projects:${userId}`;
	const cachedData = cache.get(cacheKey);

	if (cachedData) {
		return c.json({
			success: true,
			message: "Successfully retrieved Jira projects from cache",
			data: cachedData,
			source: "cache",
		});
	}

	try {
		const cloudResponse = await fetch(
			"https://api.atlassian.com/oauth/token/accessible-resources",
			{
				method: "GET",
				headers: {
					Authorization: token,
					Accept: "application/json",
				},
			},
		);

		if (!cloudResponse.ok) {
			throw new BackendError("INTERNAL_ERROR", {
				details: "Failed to fetch Jira cloud resources",
			});
		}

		const cloudInstances = await cloudResponse.json();

		if (!cloudInstances.length) {
			throw new BackendError("NOT_FOUND", {
				details: "No Jira cloud resources found",
			});
		}

		const allSitesProjects = await Promise.all(
			cloudInstances.map(async (instance) => {
				try {
					const projectsResponse = await fetch(
						`https://api.atlassian.com/ex/jira/${instance.id}/rest/api/3/project`,
						{
							method: "GET",
							headers: {
								Authorization: token,
								Accept: "application/json",
							},
						},
					);

					if (!projectsResponse.ok) {
						console.error(
							`Failed to fetch projects for cloud ID ${instance.id}`,
						);
						return {
							cloudId: instance.id,
							cloudName: instance.name,
							cloudUrl: instance.url,
							projects: [],
							error: `Failed to fetch projects: ${projectsResponse.statusText}`,
						};
					}

					const projects = await projectsResponse.json();
					return {
						cloudId: instance.id,
						cloudName: instance.name,
						cloudUrl: instance.url,
						projects,
						error: null,
					};
				} catch (error) {
					console.error(
						`Error fetching projects for cloud ID ${instance.id}:`,
						error,
					);
					return {
						cloudId: instance.id,
						cloudName: instance.name,
						cloudUrl: instance.url,
						projects: [],
						error: error.message,
					};
				}
			}),
		);

		const responseData = {
			sites: allSitesProjects,
			totalSites: cloudInstances.length,
			totalProjects: allSitesProjects.reduce(
				(acc, site) => acc + site.projects.length,
				0,
			),
			lastUpdated: new Date().toISOString(),
		};

		cache.set(cacheKey, responseData, 300);

		return c.json({
			success: true,
			message: "Successfully retrieved Jira projects",
			data: responseData,
			source: "api",
		});
	} catch (error) {
		const staleCache = cache.get(cacheKey);
		if (staleCache) {
			return c.json({
				success: true,
				message: "Retrieved Jira projects from stale cache due to API error",
				data: staleCache,
				source: "stale_cache",
				error: error.message,
			});
		}

		throw error;
	}
};

export const invalidateProjectsCache = (userId: string) => {
	const cacheKey = `jira:projects:${userId}`;
	cache.del(cacheKey);
};

export const forceRefreshJiraProjects = async (c: Context) => {
	const token = c.req.header("Authorization");

	if (!token) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Missing Authorization header",
		});
	}

	const decodedToken = jwtDecode(token.replace("Bearer ", ""));
	const userId = decodedToken.sub;

	if (!userId) {
		throw new BackendError("UNAUTHORIZED", {
			details: "Invalid user ID",
		});
	}

	invalidateProjectsCache(userId);

	return getJiraUserProjects(c);
};

export const updateProjectInCache = (
	userId: string,
	cloudId: string,
	projectId: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	projectData: any,
) => {
	const cacheKey = `jira:projects:${userId}`;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const cachedData: any = cache.get(cacheKey);

	if (cachedData) {
		const updatedSites = cachedData.sites.map((site) => {
			if (site.cloudId === cloudId) {
				const updatedProjects = site.projects.map((project) =>
					project.id === projectId ? { ...project, ...projectData } : project,
				);
				return { ...site, projects: updatedProjects };
			}
			return site;
		});

		cache.set(cacheKey, { ...cachedData, sites: updatedSites }, 300);
	}
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

	const decodedToken = jwtDecode(token.replace("Bearer ", ""));
	const userId = decodedToken.sub;
	const projectsCacheKey = `jira:projects:${userId}`;
	const projectsCache = cache.get(projectsCacheKey);

	if (!projectsCache) {
		throw new BackendError("NOT_FOUND", {
			details: "Projects data not found. Please fetch projects first.",
		});
	}

	const cloudSite = projectsCache.sites[0];
	const cloudId = cloudSite.cloudId;
	const project = cloudSite.projects.find(
		(p) => p.id === projectId || p.key === projectId,
	);

	if (!project) {
		throw new BackendError("NOT_FOUND", {
			details: "Project not found",
		});
	}

	const projectKey = project.key;

	const issuesCacheKey = `jira:issues:${cloudId}:${projectKey}`;
	const cachedIssues = cache.get(issuesCacheKey);

	if (cachedIssues) {
		return c.json({
			success: true,
			message: "Successfully retrieved project issues from cache",
			data: cachedIssues,
			source: "cache",
		});
	}

	try {
		let startAt = 0;
		const maxResults = 50;
		let allIssues = [];
		let total = null;

		do {
			const jql = encodeURIComponent(
				`project = "${projectKey}" ORDER BY created DESC`,
			);
			const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&startAt=${startAt}&maxResults=${maxResults}`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: token,
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new BackendError("INTERNAL_ERROR", {
					details: `Failed to fetch project issues: ${JSON.stringify(errorData)}`,
				});
			}

			const data = await response.json();

			if (total === null) {
				total = data.total;
			}

			if (data.issues && Array.isArray(data.issues)) {
				allIssues = [...allIssues, ...data.issues];
			}

			startAt += maxResults;
		} while (startAt < total);

		const issuesData = {
			projectKey,
			projectName: project.name,
			cloudId,
			total: allIssues.length,
			issues: allIssues.map((issue) => ({
				id: issue.id,
				key: issue.key,
				summary: issue.fields?.summary || "",
				status: issue.fields?.status
					? {
							name: issue.fields.status.name,
							category: issue.fields.status.statusCategory?.name || "",
							color: issue.fields.status.statusCategory?.colorName || "",
						}
					: null,
				priority: issue.fields?.priority
					? {
							name: issue.fields.priority.name,
							iconUrl: issue.fields.priority.iconUrl,
						}
					: null,
				assignee: issue.fields?.assignee
					? {
							accountId: issue.fields.assignee.accountId,
							displayName: issue.fields.assignee.displayName,
							email: issue.fields.assignee.emailAddress,
							avatarUrl: issue.fields.assignee.avatarUrls?.["48x48"],
						}
					: null,
				created: issue.fields?.created,
				updated: issue.fields?.updated,
				issuetype: issue.fields?.issuetype
					? {
							name: issue.fields.issuetype.name,
							iconUrl: issue.fields.issuetype.iconUrl,
							subtask: issue.fields.issuetype.subtask,
						}
					: null,
			})),
			lastUpdated: new Date().toISOString(),
		};

		cache.set(issuesCacheKey, issuesData, 300);

		return c.json({
			success: true,
			message: "Successfully retrieved project issues",
			data: issuesData,
			source: "api",
		});
	} catch (error) {
		console.error("Error fetching issues:", error);

		const staleCache = cache.get(issuesCacheKey);
		if (staleCache) {
			return c.json({
				success: true,
				message: "Retrieved project issues from stale cache due to API error",
				data: staleCache,
				source: "stale_cache",
				error: error.message,
			});
		}

		throw error;
	}
};
