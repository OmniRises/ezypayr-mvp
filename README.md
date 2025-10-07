# ezypayr-mvp

## Quickstart

1. Install dependencies:

```bash
npm install
```

2. Configure environment (use a real secret and JWKS URL in non-dev):

```bash
cp .env.example .env # if available; otherwise define the vars below

# Required env vars (example)
PORT=3000
WEBHOOK_SHARED_SECRET=replace_me_for_hmac_testing
JWKS_URL=https://example.com/.well-known/jwks.json
```

3. Run the server (TS dev mode):

```bash
npm run dev
```

4. Build and run:

```bash
npm run build && npm start
```

Server exposes:
- `POST /webhook/hmac` expecting `x-signature` header (base64 HMAC-SHA256)
- `POST /webhook/jws` expecting `Authorization: Bearer <JWS>`

## Security and secrets

- **Secrets storage**: Use Vault/KMS; do not hardcode or log secrets. In dev, `.env` can be used, but never commit real secrets.
- **Rotation**: Rotate webhook secrets; refresh JWKS regularly (HTTP caching supported by `jose` remote JWKS).

## Example verification snippets

The following small Node examples demonstrate HMAC and JWS verification (Ed25519) and align with this app's utilities.

```ts
// HMAC verification (Node)
import crypto from "crypto";

export function verifyHmac(body: Buffer, headerSignature: string, secret: string) {
  const h = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(headerSignature));
}

// JWS (Ed25519) verification with 'jose'
import { jwtVerify } from "jose";

export async function verifyJws(token: string, jwks) {
  // jwks can be fetched from /.well-known/jwks.json and cached
  const { payload } = await jwtVerify(token, jwks.getKey(token));
  return payload;
}
```

In this app, see `src/utils/verify.ts` for a production-ready variant using `createRemoteJWKSet`.
