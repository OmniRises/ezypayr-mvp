// HMAC verification (Node)
import crypto from "crypto";

export function verifyHmac(body: Buffer, headerSignature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(body).digest("base64");
  const a = Buffer.from(computed);
  const b = Buffer.from(headerSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// JWS (Ed25519) verification with 'jose'
import { jwtVerify, createRemoteJWKSet } from "jose";

export function buildRemoteJwks(jwksUrl: string) {
  return createRemoteJWKSet(new URL(jwksUrl));
}

export async function verifyJws(token: string, jwks: ReturnType<typeof buildRemoteJwks>) {
  const { payload } = await jwtVerify(token, jwks);
  return payload;
}


