import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().regex(/^\d+$/).optional().default("5050"),
  DATABASE_URI: z.string().optional().default("mongodb://localhost:27017"),
  SECRET: z.string().optional().default("PumpetBanaRaheHaiBhaiii"),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_ACCESS_KEY_SECRET: z.string(),
  AWS_ACCESS_SES_REPLY_EMAIL: z.string(),
});

const parsedSchema = envSchema.parse(process.env);

export type EnvSchemaType = z.infer<typeof envSchema>;

export default {
  NODE_ENV: parsedSchema.NODE_ENV,
  PORT: parsedSchema.PORT,
  DATABASE_URI: parsedSchema.DATABASE_URI,
  SECRET: parsedSchema.SECRET,
  AWS_ACCESS_KEY_ID: parsedSchema.AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET: parsedSchema.AWS_ACCESS_KEY_SECRET,
  AWS_ACCESS_SES_REPLY_EMAIL: parsedSchema.AWS_ACCESS_SES_REPLY_EMAIL,
};
