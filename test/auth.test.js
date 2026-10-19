import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const email = `test-${Date.now()}@example.com`;
let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve); // port 0 = pick any free port
  });
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

function postSignup(body) {
  return fetch(`${baseUrl}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("signup creates a user and never returns the hash", async () => {
  const res = await postSignup({ email, password: "correct-horse-1" });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.email, email);
  assert.ok(data.id);
  assert.equal(data.password_hash, undefined);
});

test("signup rejects a duplicate email with 409", async () => {
  const res = await postSignup({ email, password: "correct-horse-1" });
  assert.equal(res.status, 409);
});

test("signup rejects a short password with 400", async () => {
  const res = await postSignup({ email: "x@example.com", password: "short" });
  assert.equal(res.status, 400);
});

test("signup rejects a bad email with 400", async () => {
  const res = await postSignup({
    email: "not-an-email",
    password: "correct-horse-1",
  });
  assert.equal(res.status, 400);
});

test("malformed JSON returns a JSON 400", async () => {
  const res = await postSignup('{"email": ');
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid JSON" });
});
