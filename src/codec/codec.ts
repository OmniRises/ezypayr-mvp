// codec.ts
import nacl from "tweetnacl";
import stableStringify from "fast-json-stable-stringify";
import crypto from "crypto";

function base64url(b: Buffer) {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function canonicalJSON(obj: unknown): string {
  return stableStringify(obj as any);
}

export function payloadHash(obj: unknown): string {
  const canon = canonicalJSON(obj);
  const h = crypto.createHash("sha256").update(canon, "utf8").digest();
  return base64url(h);
}

export function signPayload(obj: unknown, secretKeyUint8: Uint8Array) {
  const canon = canonicalJSON(obj);
  const message = Buffer.from(canon, "utf8");
  const sig = nacl.sign.detached(new Uint8Array(message), secretKeyUint8);
  return base64url(Buffer.from(sig));
}

export function verifyPayload(obj: unknown, signatureB64u: string, publicKeyUint8: Uint8Array) {
  const canon = canonicalJSON(obj);
  const message = Buffer.from(canon, "utf8");
  const sig = Buffer.from(signatureB64u.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return nacl.sign.detached.verify(new Uint8Array(message), new Uint8Array(sig), publicKeyUint8);
}


