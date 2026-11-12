// Validated server-only configuration. Never import this from a client component.
import { z } from "zod";

export const envSchema = z.object({
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().int().positive().default(3307),
  MYSQL_DATABASE: z.string().min(1),
  DB_AUTH_USER: z.string().min(1),
  DB_AUTH_PASSWORD: z.string().regex(/^[A-Fa-f0-9]{32,}$/, "must be a generated hex secret with at least 32 characters"),
  DB_ADMIN_USER: z.string().min(1),
  DB_ADMIN_PASSWORD: z.string().regex(/^[A-Fa-f0-9]{32,}$/, "must be a generated hex secret with at least 32 characters"),
  DB_RESEARCHER_USER: z.string().min(1),
  DB_RESEARCHER_PASSWORD: z.string().regex(/^[A-Fa-f0-9]{32,}$/, "must be a generated hex secret with at least 32 characters"),
  DB_VECTOR_USER: z.string().min(1),
  DB_VECTOR_PASSWORD: z.string().regex(/^[A-Fa-f0-9]{32,}$/, "must be a generated hex secret with at least 32 characters"),
  QDRANT_URL: z.string().url().default("http://127.0.0.1:6333"),
  QDRANT_COLLECTION: z.string().min(1).default("vulnerability_reports"),
  EMBEDDING_MODEL: z.string().min(1).default("Xenova/all-MiniLM-L6-v2"),
  EMBEDDING_DIM: z.coerce.number().int().positive().default(384),
  SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
}).superRefine((value, ctx) => {
  const credentials = [value.DB_AUTH_PASSWORD, value.DB_ADMIN_PASSWORD, value.DB_RESEARCHER_PASSWORD, value.DB_VECTOR_PASSWORD];
  if (new Set(credentials).size !== credentials.length) {
    ctx.addIssue({ code: "custom", path: ["DB_AUTH_PASSWORD"], message: "application database passwords must be distinct" });
  }
});
export type Env = z.infer<typeof envSchema>;
let cached: Env | null = null;

export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${missing}. Copy .env.example to .env.`);
    }
    cached = parsed.data;
  }
  return cached;
}
