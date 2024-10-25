import { z } from "zod";

export interface JiraIssueHistory {
  id: string;
  key: string;
  changelog: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      email?: string;
      avatarUrl?: string;
    };
    created: string;
    items: Array<{
      field: string;
      fieldtype: string;
      from: string | null;
      fromString: string | null;
      to: string | null;
      toString: string | null;
    }>;
  }>;
  transitions: Array<{
    id: string;
    status: string;
    from: string;
    to: string;
    createdAt: string;
    author: {
      accountId: string;
      displayName: string;
    };
  }>;
  comments: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrl?: string;
    };
    body: string;
    created: string;
    updated: string;
  }>;
  worklog: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
    };
    timeSpentSeconds: number;
    created: string;
    started: string;
    comment?: string;
  }>;
}

export interface PointsActivity {
  issueKey: string;
  userId: string;
  points: number;
  reason: string;
  timestamp: string;
  activity: {
    type: "status_change" | "comment" | "worklog" | "update";
    field?: string;
    from?: string;
    to?: string;
    details?: string;
  };
}

export interface IssueTrack {
  issueId: string;
  issueKey: string;
  projectId: string;
  assigneeId: string;
  reporterId: string;
  status: string;
  statusCategory: string;
  points: number;
  lastUpdated: Date;
  transitions: Array<{
    from: string;
    to: string;
    timestamp: Date;
    pointsAwarded?: number;
  }>;
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
  pointsHistory: Array<{
    issueKey: string;
    points: number;
    reason: string;
    timestamp: Date;
  }>;
}

export const userSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  phoneNumber: z.number().min(8).max(12),

  points: z.number().default(0),

  adminOrgs: z.array(z.string()),
  allOrgs: z.array(z.string()),

  isCreatedAt: z.date().optional(),
  isUpdatedAt: z.date().optional().default(new Date()),

  isDeleted: z.boolean().default(false),
});

export type userType = z.infer<typeof userSchema>;
