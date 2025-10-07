import express from "express";
import { PORT, JWKS_URL, WEBHOOK_SHARED_SECRET, CODEC_PUBLIC_KEY_B64U, CODEC_SECRET_KEY_B64U } from "./config.js";
import { buildRemoteJwks, verifyHmac, verifyJws } from "./utils/verify.js";
import nacl from "tweetnacl";
import { canonicalJSON, payloadHash, signPayload, verifyPayload } from "./codec/codec.js";
import cors from "cors";

const app = express();
// JSON parser for non-HMAC routes
app.use(express.json());
app.use(cors({ origin: true }));

// HMAC route
app.post("/webhook/hmac", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.header("x-signature") ?? "";
  const ok = WEBHOOK_SHARED_SECRET && signature
    ? verifyHmac(req.body as Buffer, signature, WEBHOOK_SHARED_SECRET)
    : false;
  if (!ok) return res.status(401).send("invalid signature");
  res.status(200).send("ok");
});

// JWS route
app.post("/webhook/jws", async (req, res) => {
  try {
    const authz = req.header("authorization") ?? "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
    if (!token || !JWKS_URL) return res.status(400).send("missing token or JWKS url");
    const jwks = buildRemoteJwks(JWKS_URL);
    const payload = await verifyJws(token, jwks);
    res.status(200).json({ ok: true, payload });
  } catch (err) {
    res.status(401).send("invalid jws");
  }
});

// Codec helpers
function b64uToUint8(b64u: string) {
  if (!b64u) return new Uint8Array();
  const b = Buffer.from(b64u.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return new Uint8Array(b);
}

app.post("/codec/hash", (req, res) => {
  try {
    const hash = payloadHash(req.body);
    res.json({ hash });
  } catch (e) {
    res.status(400).json({ error: "invalid json" });
  }
});

app.post("/codec/sign", (req, res) => {
  try {
    const secretKey = b64uToUint8(CODEC_SECRET_KEY_B64U);
    if (!secretKey.length) return res.status(400).json({ error: "missing secret key" });
    const sig = signPayload(req.body, secretKey);
    res.json({ signature: sig, canonical: canonicalJSON(req.body) });
  } catch (e) {
    res.status(400).json({ error: "sign failed" });
  }
});

app.post("/codec/verify", (req, res) => {
  try {
    const { signature } = req.body ?? {};
    if (typeof signature !== "string") return res.status(400).json({ error: "missing signature" });
    const publicKey = b64uToUint8(CODEC_PUBLIC_KEY_B64U);
    if (!publicKey.length) return res.status(400).json({ error: "missing public key" });
    const ok = verifyPayload(req.body.payload ?? req.body, signature, publicKey);
    res.json({ ok });
  } catch (e) {
    res.status(400).json({ error: "verify failed" });
  }
});

app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});


