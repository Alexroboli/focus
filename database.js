const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const ROOT = __dirname;
const DATA_DIR = process.env.FOCUS_DATA_DIR || path.join(ROOT, "data");
const DB_PATH = process.env.FOCUS_DB_PATH || path.join(DATA_DIR, "focus.db");
const PASSWORD_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };
const DEFAULT_TENANT_NAME = "Familia";

let dbPromise = null;

function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

async function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec("PRAGMA journal_mode = WAL");
  await db.exec("PRAGMA foreign_keys = ON");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      recovery_hash TEXT NOT NULL,
      recovery_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_members (
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      PRIMARY KEY (tenant_id, user_id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tenant_invites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      token_hash TEXT NOT NULL,
      token_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tenant_state (
      tenant_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  return db;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

function createRecoveryCode() {
  return crypto.randomBytes(18).toString("base64url");
}

function hashSecret(secret, salt = crypto.randomBytes(16).toString("base64")) {
  const hash = crypto.scryptSync(String(secret), salt, PASSWORD_PARAMS.keylen, {
    N: PASSWORD_PARAMS.N,
    r: PASSWORD_PARAMS.r,
    p: PASSWORD_PARAMS.p
  }).toString("base64");
  return { hash, salt };
}

function verifySecret(secret, hash, salt) {
  const current = hashSecret(secret, salt).hash;
  const left = Buffer.from(current, "base64");
  const right = Buffer.from(String(hash), "base64");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function hasUsers() {
  const db = await getDb();
  const row = await db.get("SELECT COUNT(*) AS count FROM users");
  return row.count > 0;
}

async function createInitialAccount({ name, email, password, tenantName }) {
  const db = await getDb();
  const now = new Date().toISOString();
  const tenantId = createId("tenant");
  const userId = createId("user");
  const recoveryCode = createRecoveryCode();
  const passwordData = hashSecret(password);
  const recoveryData = hashSecret(recoveryCode);

  await db.exec("BEGIN");
  try {
    await db.run("INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)", tenantId, tenantName || DEFAULT_TENANT_NAME, now);
    await db.run(
      "INSERT INTO users (id, email, name, password_hash, password_salt, recovery_hash, recovery_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      userId, normalizeEmail(email), name || normalizeEmail(email), passwordData.hash, passwordData.salt, recoveryData.hash, recoveryData.salt, now, now
    );
    await db.run("INSERT INTO tenant_members (tenant_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)", tenantId, userId, now);
    await db.run("INSERT INTO tenant_state (tenant_id, state_json, updated_at, updated_by) VALUES (?, ?, ?, ?)", tenantId, JSON.stringify(null), now, userId);
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return { user: { id: userId, name, email: normalizeEmail(email) }, tenant: { id: tenantId, name: tenantName || DEFAULT_TENANT_NAME }, recoveryCode };
}

async function authenticateUser(email, password) {
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ? COLLATE NOCASE", normalizeEmail(email));
  if (!user || !verifySecret(password, user.password_hash, user.password_salt)) return null;
  const member = await db.get(`
    SELECT tm.tenant_id AS tenantId, tm.role, t.name AS tenantName
    FROM tenant_members tm
    JOIN tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = ?
    ORDER BY tm.created_at ASC
    LIMIT 1
  `, user.id);
  if (!member) return null;
  return buildSessionUser(user, member);
}

async function createInvite(session, email) {
  const db = await getDb();
  await ensureOwner(session);
  const now = new Date().toISOString();
  const token = createRecoveryCode();
  const tokenData = hashSecret(token);
  const inviteId = createId("invite");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  await db.run(
    "INSERT INTO tenant_invites (id, tenant_id, email, token_hash, token_salt, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?, 'member', ?, ?)",
    inviteId, session.tenantId, normalizeEmail(email), tokenData.hash, tokenData.salt, expiresAt, now
  );
  return { email: normalizeEmail(email), inviteCode: token, expiresAt };
}

async function acceptInvite({ name, email, password, inviteCode }) {
  const db = await getDb();
  const normalizedEmail = normalizeEmail(email);
  const invites = await db.all("SELECT * FROM tenant_invites WHERE email = ? COLLATE NOCASE AND accepted_at IS NULL", normalizedEmail);
  const invite = invites.find((item) => new Date(item.expires_at).getTime() > Date.now() && verifySecret(inviteCode, item.token_hash, item.token_salt));
  if (!invite) return null;

  const existing = await db.get("SELECT * FROM users WHERE email = ? COLLATE NOCASE", normalizedEmail);
  const now = new Date().toISOString();
  const recoveryCode = createRecoveryCode();
  const recoveryData = hashSecret(recoveryCode);
  let userId = existing?.id;

  await db.exec("BEGIN");
  try {
    if (!existing) {
      userId = createId("user");
      const passwordData = hashSecret(password);
      await db.run(
        "INSERT INTO users (id, email, name, password_hash, password_salt, recovery_hash, recovery_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        userId, normalizedEmail, name || normalizedEmail, passwordData.hash, passwordData.salt, recoveryData.hash, recoveryData.salt, now, now
      );
    }
    await db.run("INSERT OR IGNORE INTO tenant_members (tenant_id, user_id, role, created_at) VALUES (?, ?, ?, ?)", invite.tenant_id, userId, invite.role, now);
    await db.run("UPDATE tenant_invites SET accepted_at = ? WHERE id = ?", now, invite.id);
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return { recoveryCode };
}

async function resetPasswordWithRecovery({ email, recoveryCode, newPassword }) {
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ? COLLATE NOCASE", normalizeEmail(email));
  if (!user || !verifySecret(recoveryCode, user.recovery_hash, user.recovery_salt)) return null;
  const nextRecoveryCode = createRecoveryCode();
  const passwordData = hashSecret(newPassword);
  const recoveryData = hashSecret(nextRecoveryCode);
  await db.run(
    "UPDATE users SET password_hash = ?, password_salt = ?, recovery_hash = ?, recovery_salt = ?, updated_at = ? WHERE id = ?",
    passwordData.hash, passwordData.salt, recoveryData.hash, recoveryData.salt, new Date().toISOString(), user.id
  );
  return { recoveryCode: nextRecoveryCode };
}

async function listMembers(session) {
  const db = await getDb();
  return db.all(`
    SELECT u.id, u.email, u.name, tm.role, tm.created_at AS joinedAt
    FROM tenant_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.tenant_id = ?
    ORDER BY tm.created_at ASC
  `, session.tenantId);
}

async function readTenantState(session, fallbackState) {
  const db = await getDb();
  let row = await db.get("SELECT state_json AS stateJson FROM tenant_state WHERE tenant_id = ?", session.tenantId);
  if (!row) {
    await writeTenantState(session, fallbackState);
    row = await db.get("SELECT state_json AS stateJson FROM tenant_state WHERE tenant_id = ?", session.tenantId);
  }
  const parsed = JSON.parse(row.stateJson);
  return parsed || fallbackState;
}

async function writeTenantState(session, state) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.run(`
    INSERT INTO tenant_state (tenant_id, state_json, updated_at, updated_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tenant_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at, updated_by = excluded.updated_by
  `, session.tenantId, JSON.stringify(state), now, session.userId);
}

async function ensureOwner(session) {
  if (session.role !== "owner") throw Object.assign(new Error("Somente o dono pode convidar usuarios."), { statusCode: 403 });
}

function buildSessionUser(user, member) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    tenantId: member.tenantId,
    tenantName: member.tenantName,
    role: member.role
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

module.exports = {
  DB_PATH,
  getDb,
  hasUsers,
  createInitialAccount,
  authenticateUser,
  createInvite,
  acceptInvite,
  resetPasswordWithRecovery,
  listMembers,
  readTenantState,
  writeTenantState
};
