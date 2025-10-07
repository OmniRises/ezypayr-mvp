import dotenv from "dotenv";

// Load environment variables (in production, use Vault/KMS to inject secrets)
dotenv.config();

export const PORT = parseInt(process.env.PORT ?? "3000", 10);
export const WEBHOOK_SHARED_SECRET = process.env.WEBHOOK_SHARED_SECRET ?? "";
export const JWKS_URL = process.env.JWKS_URL ?? "";
export const CODEC_PUBLIC_KEY_B64U = process.env.CODEC_PUBLIC_KEY_B64U ?? "";
export const CODEC_SECRET_KEY_B64U = process.env.CODEC_SECRET_KEY_B64U ?? "";


