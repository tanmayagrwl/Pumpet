import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(3).max(255),
  company: z.string().min(3).max(255),
  companyTag: z.string().min(3).max(255),
  email: z.string().email(),
  phoneNumber: z.number().min(8).max(12),
  message: z.string().min(3).max(520),
});

export type brandType = z.infer<typeof brandSchema>;
