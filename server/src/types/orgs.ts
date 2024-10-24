import { z } from "zod";

export const orgSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  hash: z.string(),

  // TODO extend other fields related to organization later
});

export const createOrgSchema = orgSchema.pick({
  name: true,
  email: true,
  hash: true,
});

export type OrgType = z.infer<typeof orgSchema>;
export type CreateOrgType = z.infer<typeof createOrgSchema>;
