import { z } from "zod";

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
