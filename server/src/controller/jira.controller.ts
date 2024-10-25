import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { jwtDecode } from "jwt-decode";
import { cache } from "../db/cache";
import db from "../db/db";
import type { JiraIssueHistory, PointsActivity, userType } from "../types/user";
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
    "manage:jira-configuration",
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

    cache.set(cacheKey, responseData, 10);

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

    cache.set(cacheKey, { ...cachedData, sites: updatedSites }, 10);
  }
};

export const getIssueTransitions = async (c: Context) => {
  const accessToken = c.req.header("Authorization") as string;
  const cloudId = c.req.param("cloudId");
  const issueKey = c.req.param("issueKey"); // Changed from issuse_id to issueKey

  // Validate inputs
  if (!accessToken || !cloudId || !issueKey) {
    throw new BackendError("BAD_REQUEST", {
      details: "Missing required parameters",
    });
  }

  try {
    const [transitionsResponse, changeLogResponse] = await Promise.all([
      fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/transitions`,
        {
          method: "GET",
          headers: {
            Authorization: accessToken,
            Accept: "application/json",
          },
        },
      ),
      fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/changelog`,
        {
          method: "GET",
          headers: {
            Authorization: accessToken,
            Accept: "application/json",
          },
        },
      ),
    ]);

    if (!transitionsResponse.ok || !changeLogResponse.ok) {
      throw new BackendError("INTERNAL_ERROR", {
        details: "Failed to fetch issue transitions or changelog",
      });
    }

    const [transitionData, changeLogData] = await Promise.all([
      transitionsResponse.json(),
      changeLogResponse.json(),
    ]);

    return c.json({
      success: true,
      data: {
        transitions: transitionData.transitions || [],
        changelog: changeLogData.values || [],
        issueKey,
      },
    });
  } catch (error) {
    console.error("Error fetching transitions:", error);
    throw new BackendError("INTERNAL_ERROR", {
      details: "Failed to fetch issue transitions",
    });
  }
};

export const getJiraProjectIssues = async (c: Context) => {
  const token = c.req.header("Authorization");
  const cloudId = c.req.param("cloudId");

  if (!token) {
    throw new BackendError("UNAUTHORIZED", {
      details: "Missing Authorization header",
    });
  }

  if (!cloudId) {
    throw new BackendError("BAD_REQUEST", {
      details: "Missing cloudId",
    });
  }

  const decodedToken = jwtDecode(token.replace("Bearer ", ""));
  const userId = decodedToken.sub;
  const projectsCacheKey = `jira:projects:${userId}`;
  const projectsCache = cache.get(projectsCacheKey) as {
    sites: Array<{
      cloudId: string;
      projects: Array<{
        id: string;
        key: string;
        name: string;
      }>;
    }>;
  };

  if (!projectsCache) {
    throw new BackendError("NOT_FOUND", {
      details: "Projects data not found. Please fetch projects first.",
    });
  }

  const cloudSite = projectsCache.sites.find(
    (site) => site.cloudId === cloudId,
  );
  if (!cloudSite) {
    throw new BackendError("NOT_FOUND", {
      details: "Cloud site not found",
    });
  }

  const project = cloudSite.projects[0];
  if (!project) {
    throw new BackendError("NOT_FOUND", {
      details: "No projects found for this cloud site",
    });
  }

  const issuesCacheKey = `jira:issues:${cloudId}:${project.key}`;
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
    const allIssues: JiraIssue[] = [];
    let total: number | null = null;

    do {
      const jql = encodeURIComponent(
        `project = "${project.key}" ORDER BY created DESC`,
      );
      const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&startAt=${startAt}&maxResults=${maxResults}&expand=changelog&fields=summary,status,priority,assignee,created,updated,issuetype,comment,worklog`;

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
      total = data.total;

      if (data.issues && Array.isArray(data.issues)) {
        const issues = data.issues as JiraIssue[];
        const issuesWithHistory = await Promise.all(
          issues.map(async (issue) => {
            const [changelogResponse, commentsResponse, worklogResponse] =
              await Promise.all([
                fetch(
                  `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issue.key}/changelog`,
                  {
                    headers: {
                      Authorization: token,
                      Accept: "application/json",
                    },
                  },
                ),
                fetch(
                  `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issue.key}/comment`,
                  {
                    headers: {
                      Authorization: token,
                      Accept: "application/json",
                    },
                  },
                ),
                fetch(
                  `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issue.key}/worklog`,
                  {
                    headers: {
                      Authorization: token,
                      Accept: "application/json",
                    },
                  },
                ),
              ]);

            const [changelog, comments, worklog] = await Promise.all([
              changelogResponse.json(),
              commentsResponse.json(),
              worklogResponse.json(),
            ]);

            return {
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
              history: {
                transitions: changelog.values.map((history: any) => ({
                  id: history.id,
                  author: {
                    accountId: history.author.accountId,
                    displayName: history.author.displayName,
                    avatarUrl: history.author.avatarUrls?.["48x48"],
                  },
                  created: history.created,
                  items: history.items.map((item: any) => ({
                    field: item.field,
                    fieldtype: item.fieldtype,
                    from: item.fromString,
                    to: item.toString,
                  })),
                })),
                comments: comments.comments.map((comment: any) => ({
                  id: comment.id,
                  author: {
                    accountId: comment.author.accountId,
                    displayName: comment.author.displayName,
                    avatarUrl: comment.author.avatarUrls?.["48x48"],
                  },
                  body: comment.body,
                  created: comment.created,
                  updated: comment.updated,
                })),
                worklog: worklog.worklogs.map((log: any) => ({
                  id: log.id,
                  author: {
                    accountId: log.author.accountId,
                    displayName: log.author.displayName,
                    avatarUrl: log.author.avatarUrls?.["48x48"],
                  },
                  timeSpent: log.timeSpent,
                  timeSpentSeconds: log.timeSpentSeconds,
                  started: log.started,
                  created: log.created,
                  updated: log.updated,
                  comment: log.comment,
                })),
              },
            };
          }),
        );

        allIssues.push(...issuesWithHistory);
      }

      startAt += maxResults;
    } while (startAt < (total ?? 0));

    const issuesData = {
      projectKey: project.key,
      projectName: project.name,
      cloudId,
      total: allIssues.length,
      issues: allIssues,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(issuesCacheKey, issuesData, 10);

    return c.json({
      success: true,
      message: "Successfully retrieved project issues with history",
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
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    throw error;
  }
};

export const getAudits = async (cloudId: string, accessToken: string) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const [auditResponse, issueEventsResponse, commentsResponse] =
      await Promise.all([
        fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/auditing/record?from=${startDate.toISOString()}&to=${endDate.toISOString()}&limit=1000`,
          {
            method: "GET",
            headers: {
              Authorization: accessToken,
              Accept: "application/json",
            },
          },
        ),
        fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
          {
            method: "POST",
            headers: {
              Authorization: accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jql: `updated >= "${startDate.toISOString().split("T")[0]}"`,
              fields: [
                "summary",
                "status",
                "assignee",
                "creator",
                "created",
                "updated",
                "comment",
                "worklog",
              ],
              expand: ["changelog"],
            }),
          },
        ),
        fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
          {
            method: "POST",
            headers: {
              Authorization: accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jql: `commented >= "${startDate.toISOString().split("T")[0]}"`,
              fields: ["comment"],
            }),
          },
        ),
      ]);

    if (!auditResponse.ok || !issueEventsResponse.ok) {
      console.log("audit", auditResponse);
      console.log("events", issueEventsResponse);
      throw new Error("One or more API requests failed");
    }

    const [auditData, issueEvents] = await Promise.all([
      auditResponse.json() as Promise<AuditResponse>,
      issueEventsResponse.json() as Promise<{ issues: JiraIssue[] }>,
    ]);

    return {
      administrativeEvents: auditData || { records: [] },
      issueEvents: (issueEvents?.issues || []).map((issue) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary,
        creator: issue.fields?.creator,
        created: issue.fields?.created,
        updated: issue.fields?.updated,
        changelog: issue.changelog?.histories || [],
        comments: issue.fields?.comment?.comments || [],
        worklog: issue.fields?.worklog?.worklogs || [],
      })),
    };
  } catch (error) {
    console.error("Error fetching audit data:", error);
    throw new BackendError("INTERNAL_ERROR", {
      details: "Failed to fetch audit data",
    });
  }
};

export const getAuditLogs = async (c: Context) => {
  try {
    const projectId = c.req.param("id");
    const accessToken = c.req.header("Authorization") as string;

    if (!projectId || !accessToken) {
      throw new BackendError("BAD_REQUEST", {
        details: "Missing required parameters",
      });
    }

    const audits = await getAudits(projectId, accessToken);

    return c.json({
      success: true,
      data: audits,
    });
  } catch (error) {
    if (error instanceof BackendError) {
      throw error;
    }
    throw new BackendError("INTERNAL_ERROR", {
      details: "Failed to process audit logs",
    });
  }
};

function parseAuditActivities(auditData: AuditResponse) {
  const activities: UserActivity[] = [];

  for (const record of auditData.records) {
    if (["issues", "comments", "fields"].includes(record.category)) {
      activities.push({
        type: record.category,
        authorId: record.authorAccountId,
        date: record.created,
        summary: record.summary,
      });
    }
  }

  return activities;
}

// Group activities by user
function groupActivitiesByUser(activities: UserActivity[]): UserActivities {
  const userActivities: UserActivities = {};

  for (const activity of activities) {
    if (activity.authorId) {
      if (!userActivities[activity.authorId]) {
        userActivities[activity.authorId] = {
          updates: [],
          comments: [],
          fields: [],
          created: null,
          resolved: null,
        };
      }

      switch (activity.type) {
        case "issues":
          userActivities[activity.authorId].updates.push(activity);
          if (activity.summary.includes("created")) {
            userActivities[activity.authorId].created = activity.date;
          }
          if (activity.summary.includes("resolved")) {
            userActivities[activity.authorId].resolved = activity.date;
          }
          break;
        case "comments":
          userActivities[activity.authorId].comments.push(activity);
          break;
        case "fields":
          userActivities[activity.authorId].fields.push(activity);
          break;
      }
    }
  }

  return userActivities;
}

// Calculate points for a specific user
function calculateUserPoints(userActivities) {
  let totalPoints = 0;

  const updatesByDay = new Map();
  userActivities.updates.forEach((update) => {
    const dateStr = update.date.split("T")[0];
    if (!updatesByDay.has(dateStr)) {
      updatesByDay.set(dateStr, []);
    }
    updatesByDay.get(dateStr).push(update);

    const prevDate = new Date(dateStr);
    prevDate.setDate(prevDate.getDate() - 2);
    const prevDateStr = prevDate.toISOString().split("T")[0];

    if (!updatesByDay.has(prevDateStr)) {
      totalPoints += 1;
    }
  });

  console.log({
    userActivities,
  });
  if (userActivities.created && userActivities.resolved) {
    const resolutionTime = Math.floor(
      (new Date(userActivities.resolved) - new Date(userActivities.created)) /
        (1000 * 60 * 60 * 24),
    );

    if (resolutionTime <= 1) totalPoints += 5;
    else if (resolutionTime <= 3) totalPoints += 3;
    else if (resolutionTime <= 7) totalPoints += 2;
    else totalPoints += 1;
  }

  totalPoints += userActivities.comments.length;

  totalPoints += userActivities.fields.length;

  return totalPoints;
}

// Main function to process audit data and calculate points
function processAuditAndCalculatePoints(data) {
  const userPoints = {};

  data.administrativeEvents.records.forEach((record) => {
    const userId = record.authorAccountId;
    if (!userPoints[userId]) {
      userPoints[userId] = {
        total: 0,
        adminActions: 0,
        issueCreated: 0,
        issueUpdated: 0,
        comments: 0,
        transitions: 0,
        worklog: 0,
      };
    }
    userPoints[userId].adminActions += 1;
    userPoints[userId].total += 1;
  });

  data.issueEvents.forEach((issue) => {
    const creatorId = issue.creator.accountId;
    if (!userPoints[creatorId]) {
      userPoints[creatorId] = {
        total: 0,
        adminActions: 0,
        issueCreated: 0,
        issueUpdated: 0,
        comments: 0,
        transitions: 0,
        worklog: 0,
      };
    }
    userPoints[creatorId].issueCreated += 5;
    userPoints[creatorId].total += 5;

    issue.changelog.forEach((history) => {
      const userId = history.author.accountId;
      if (!userPoints[userId]) {
        userPoints[userId] = {
          total: 0,
          adminActions: 0,
          issueCreated: 0,
          issueUpdated: 0,
          comments: 0,
          transitions: 0,
          worklog: 0,
        };
      }

      history.items.forEach((item) => {
        if (item.field === "status") {
          userPoints[userId].transitions += 2;
          userPoints[userId].total += 2;
        }
      });
    });

    issue.comments.forEach((comment) => {
      const userId = comment.author.accountId;
      if (!userPoints[userId]) {
        userPoints[userId] = {
          total: 0,
          adminActions: 0,
          issueCreated: 0,
          issueUpdated: 0,
          comments: 0,
          transitions: 0,
          worklog: 0,
        };
      }
      userPoints[userId].comments += 1;
      userPoints[userId].total += 1;
    });

    issue.worklog.forEach((log) => {
      const userId = log.author.accountId;
      if (!userPoints[userId]) {
        userPoints[userId] = {
          total: 0,
          adminActions: 0,
          issueCreated: 0,
          issueUpdated: 0,
          comments: 0,
          transitions: 0,
          worklog: 0,
        };
      }
      const hours = log.timeSpentSeconds / 3600;
      const points = Math.min(Math.floor(hours), 8);
      userPoints[userId].worklog += points;
      userPoints[userId].total += points;
    });
  });

  return userPoints;
}

export const getUserPointsPerProject = async (c: Context) => {
  const cloudId = c.req.param("id");
  const accessToken = c.req.header("Authorization") as string;

  const auditData = await getAudits(cloudId, accessToken);
  const points = processAuditAndCalculatePoints(auditData);

  return c.json({
    success: true,
    data: {
      points,
      details: auditData,
    },
  });
};

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    status?: {
      name: string;
      statusCategory?: {
        name: string;
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    creator?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    created?: string;
    updated?: string;
    issuetype?: {
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    comment?: {
      comments: Array<{
        id: string;
        author: {
          accountId: string;
          displayName: string;
          avatarUrls?: { [key: string]: string };
        };
        body: any;
        created: string;
        updated: string;
      }>;
    };
    worklog?: {
      worklogs: Array<{
        id: string;
        author: {
          accountId: string;
          displayName: string;
          avatarUrls?: { [key: string]: string };
        };
        timeSpent: string;
        timeSpentSeconds: number;
        started: string;
        created: string;
        updated: string;
        comment?: string;
      }>;
    };
  };
  changelog?: {
    histories: Array<{
      id: string;
      author: {
        accountId: string;
        displayName: string;
        avatarUrls?: { [key: string]: string };
      };
      created: string;
      items: Array<{
        field: string;
        fieldtype: string;
        from: string;
        fromString: string;
        to: string;
        toString: string;
      }>;
    }>;
  };
}

interface AuditResponse {
  records: Array<{
    id: string;
    authorAccountId: string;
    category: string;
    summary: string;
    created: string;
    changedValues?: any[];
    objectItem?: any;
  }>;
}

interface ChangelogResponse {
  values: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    created: string;
    items: Array<{
      field: string;
      fieldtype: string;
      fromString: string;
      toString: string;
    }>;
  }>;
}

interface CommentsResponse {
  comments: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    body: string;
    created: string;
    updated: string;
  }>;
}

interface WorklogResponse {
  worklogs: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    timeSpent: string;
    timeSpentSeconds: number;
    started: string;
    created: string;
    updated: string;
    comment?: string;
  }>;
}

interface UserActivity {
  type: string;
  authorId: string;
  date: string;
  summary: string;
}

interface UserActivities {
  [key: string]: {
    updates: UserActivity[];
    comments: UserActivity[];
    fields: UserActivity[];
    created: string | null;
    resolved: string | null;
  };
}

interface JiraAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "issue_created"
    | "issue_updated"
    | "status_changed"
    | "comment_added"
    | "worklog_added"
    | "field_updated";
  userId: string;
  userName: string;
  issueKey: string;
  details: {
    from?: string;
    to?: string;
    field?: string;
    points?: number;
    description?: string;
  };
}

interface UserActivitySummary {
  userId: string;
  userName: string;
  points: {
    total: number;
    breakdown: {
      issuesCreated: number;
      statusTransitions: number;
      comments: number;
      worklog: number;
      fieldUpdates: number;
    };
  };
  activities: {
    issuesCreated: JiraAuditEvent[];
    statusTransitions: JiraAuditEvent[];
    comments: JiraAuditEvent[];
    worklog: JiraAuditEvent[];
    fieldUpdates: JiraAuditEvent[];
  };
}

async function getProjectIssues(
  cloudId: string,
  projectKey: string,
  accessToken: string,
): Promise<JiraIssue[]> {
  try {
    let startAt = 0;
    const maxResults = 50;
    const allIssues: JiraIssue[] = [];
    let total: number | null = null;

    do {
      const jql = encodeURIComponent(
        `project = "${projectKey}" ORDER BY created DESC`,
      );
      const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&startAt=${startAt}&maxResults=${maxResults}&expand=changelog&fields=*all`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: accessToken,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }

      const data = await response.json();
      total = data.total;

      if (data.issues && Array.isArray(data.issues)) {
        allIssues.push(...data.issues);
      }

      startAt += maxResults;
    } while (startAt < (total ?? 0));

    return allIssues;
  } catch (error) {
    console.error("Error fetching project issues:", error);
    throw error;
  }
}

export const getDetailedAuditLogs = async (c: Context) => {
  const cloudId = c.req.param("cloudId");
  const projectKey = c.req.param("projectKey");
  const accessToken = c.req.header("Authorization") as string;

  try {
    // Get all issues for the project
    const issues = await getProjectIssues(cloudId, projectKey, accessToken);
    const auditEvents: JiraAuditEvent[] = [];

    // Process each issue
    for (const issue of issues) {
      // Track issue creation
      auditEvents.push({
        id: `creation-${issue.id}`,
        timestamp: issue.fields.created,
        eventType: "issue_created",
        userId: issue.fields.creator.accountId,
        userName: issue.fields.creator.displayName,
        issueKey: issue.key,
        details: {
          points: 5, // Base points for creating an issue
          description: `Created issue: ${issue.fields.summary}`,
        },
      });

      // Process status changes from changelog
      if (issue.changelog?.histories) {
        for (const history of issue.changelog.histories) {
          for (const item of history.items) {
            if (item.field === "status") {
              const points = calculateStatusChangePoints(
                item.fromString,
                item.toString,
              );
              auditEvents.push({
                id: `status-${history.id}`,
                timestamp: history.created,
                eventType: "status_changed",
                userId: history.author.accountId,
                userName: history.author.displayName,
                issueKey: issue.key,
                details: {
                  from: item.fromString,
                  to: item.toString,
                  points,
                  description: `Changed status from ${item.fromString} to ${item.toString}`,
                },
              });
            }
          }
        }
      }

      // Process comments
      if (issue.fields.comment?.comments) {
        for (const comment of issue.fields.comment.comments) {
          const points = calculateCommentPoints(comment.body);
          auditEvents.push({
            id: `comment-${comment.id}`,
            timestamp: comment.created,
            eventType: "comment_added",
            userId: comment.author.accountId,
            userName: comment.author.displayName,
            issueKey: issue.key,
            details: {
              points,
              description: `Added comment (${comment.body.length} characters)`,
            },
          });
        }
      }

      // Process worklog
      if (issue.fields.worklog?.worklogs) {
        for (const log of issue.fields.worklog.worklogs) {
          const points = calculateWorklogPoints(log.timeSpentSeconds);
          auditEvents.push({
            id: `worklog-${log.id}`,
            timestamp: log.created,
            eventType: "worklog_added",
            userId: log.author.accountId,
            userName: log.author.displayName,
            issueKey: issue.key,
            details: {
              points,
              description: `Logged work: ${log.timeSpent}`,
            },
          });
        }
      }
    }

    // Calculate user summaries
    const userSummaries = new Map<string, UserActivitySummary>();

    for (const event of auditEvents) {
      let userSummary = userSummaries.get(event.userId);
      if (!userSummary) {
        userSummary = {
          userId: event.userId,
          userName: event.userName,
          points: {
            total: 0,
            breakdown: {
              issuesCreated: 0,
              statusTransitions: 0,
              comments: 0,
              worklog: 0,
              fieldUpdates: 0,
            },
          },
          activities: {
            issuesCreated: [],
            statusTransitions: [],
            comments: [],
            worklog: [],
            fieldUpdates: [],
          },
        };
        userSummaries.set(event.userId, userSummary);
      }

      // Update points and activities
      const points = event.details.points || 0;
      userSummary.points.total += points;

      switch (event.eventType) {
        case "issue_created":
          userSummary.points.breakdown.issuesCreated += points;
          userSummary.activities.issuesCreated.push(event);
          break;
        case "status_changed":
          userSummary.points.breakdown.statusTransitions += points;
          userSummary.activities.statusTransitions.push(event);
          break;
        case "comment_added":
          userSummary.points.breakdown.comments += points;
          userSummary.activities.comments.push(event);
          break;
        case "worklog_added":
          userSummary.points.breakdown.worklog += points;
          userSummary.activities.worklog.push(event);
          break;
        case "field_updated":
          userSummary.points.breakdown.fieldUpdates += points;
          userSummary.activities.fieldUpdates.push(event);
          break;
      }
    }

    return c.json({
      success: true,
      data: {
        summary: Array.from(userSummaries.values()),
        details: {
          totalEvents: auditEvents.length,
          events: auditEvents,
        },
      },
    });
  } catch (error) {
    console.error("Error getting detailed audit logs:", error);
    throw new BackendError("INTERNAL_ERROR", {
      details: "Failed to get detailed audit logs",
    });
  }
};

function calculateStatusChangePoints(
  fromStatus: string,
  toStatus: string,
): number {
  const statusPoints = {
    "To Do": {
      "In Progress": 3,
      Done: 5,
    },
    "In Progress": {
      Done: 8,
      "To Do": -2,
    },
    Done: {
      "To Do": -5,
      "In Progress": -3,
    },
  };

  return statusPoints[fromStatus]?.[toStatus] || 0;
}

function calculateCommentPoints(comment: string): number {
  let points = 0;
  if (comment.length > 100) points += 2;
  if (comment.includes("@")) points += 1;
  if (comment.includes("```")) points += 2; // Code blocks
  return points;
}

function calculateWorklogPoints(timeSpentSeconds: number): number {
  const hours = timeSpentSeconds / 3600;
  return Math.min(Math.floor(hours), 8); // Cap at 8 points per worklog
}
