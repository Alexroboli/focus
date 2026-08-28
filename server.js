const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_PATH = process.env.FOCUS_DATA_PATH || path.join(ROOT, "data.json");
const CONFIG_PATH = process.env.FOCUS_CONFIG_PATH || path.join(ROOT, "config.server.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_BODY_BYTES = 1024 * 1024;
const DATA_VERSION = 2;

const sessions = new Map();
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

const seedState = {
  activeFilter: "inbox",
  activeProjectId: null,
  statusFilter: "all",
  priorityFilter: null,
  view: "list",
  selectedTaskId: "t1",
  projects: [
    { id: "p1", name: "Pessoal", color: "#d94f35" },
    { id: "p2", name: "Trabalho", color: "#376da8" },
    { id: "p3", name: "Estudos", color: "#2f7d6b" }
  ],
  tasks: [
    {
      id: "t1",
      title: "Organizar tarefas da semana",
      description: "Definir prioridades, prazos e tarefas recorrentes.",
      projectId: "p1",
      priority: "alta",
      status: "andamento",
      due: new Date().toISOString(),
      labels: ["planejamento"],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: "s1", title: "Revisar pendencias", done: true },
        { id: "s2", title: "Definir 3 prioridades", done: false }
      ]
    }
  ],
  activity: []
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/login" && req.method === "POST") return handleLogin(req, res);
    if (url.pathname === "/api/logout" && req.method === "POST") return handleLogout(req, res);
    if (url.pathname === "/api/state" && req.method === "GET") return handleGetState(req, res);
    if (url.pathname === "/api/state" && req.method === "PUT") return handlePutState(req, res);
    if (url.pathname.startsWith("/api/")) return sendJson(res, 404, { message: "Rota nao encontrada." });

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { message: "Erro interno do servidor." });
  }
});

server.listen(PORT, () => {
  console.log(`Focus rodando em http://localhost:${PORT}`);
});

async function handleLogin(req, res) {
  const config = loadConfig();
  if (!config.passwordHash) {
    return sendJson(res, 500, { message: "Senha do servidor nao configurada." });
  }

  const body = await readJsonBody(req);
  const password = String(body.password || "");
  const inputHash = sha256(password);
  if (!safeEqual(inputHash, config.passwordHash)) {
    return sendJson(res, 401, { message: "Senha invalida." });
  }

  const dataKey = deriveDataKey(password, config.encryptionSalt || config.passwordHash);
  migrateDataFileIfNeeded(dataKey);

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, dataKey });
  res.setHeader("Set-Cookie", buildSessionCookie(req, token));
  return sendJson(res, 200, { ok: true });
}

function handleLogout(req, res) {
  const token = getSessionToken(req);
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "focus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  return sendJson(res, 200, { ok: true });
}

function handleGetState(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  return sendJson(res, 200, { ok: true, data: readState(session.dataKey) });
}

async function handlePutState(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  const body = await readJsonBody(req);
  const state = normalizeState(body);
  writeState(state, session.dataKey);
  return sendJson(res, 200, { ok: true });
}

function serveStatic(requestPath, res) {
  const cleanPath = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
  const filePath = path.normalize(path.join(ROOT, cleanPath));

  if (!filePath.startsWith(ROOT) || isBlockedFile(filePath)) {
    return sendText(res, 403, "Acesso negado.");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) return sendText(res, 404, "Arquivo nao encontrado.");
    const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
    res.end(content);
  });
}

function isBlockedFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  return name.startsWith(".") ||
    name === "server.js" ||
    name === "data.json" ||
    name === "config.server.json" ||
    name === "package.json" ||
    filePath.toLowerCase().includes(`${path.sep}.git${path.sep}`);
}

function loadConfig() {
  if (process.env.FOCUS_PASSWORD_HASH) {
    return {
      passwordHash: process.env.FOCUS_PASSWORD_HASH.trim().toLowerCase(),
      encryptionSalt: String(process.env.FOCUS_ENCRYPTION_SALT || "").trim()
    };
  }

  if (!fs.existsSync(CONFIG_PATH)) return {};
  const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  return {
    passwordHash: String(parsed.passwordHash || "").trim().toLowerCase(),
    encryptionSalt: String(parsed.encryptionSalt || "").trim()
  };
}

function migrateDataFileIfNeeded(dataKey) {
  if (!fs.existsSync(DATA_PATH)) {
    writeState(seedState, dataKey);
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (parsed?.encrypted === true) return;
  writeState(normalizeState(parsed), dataKey);
}

function readState(dataKey) {
  if (!fs.existsSync(DATA_PATH)) writeState(seedState, dataKey);
  const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (parsed?.encrypted !== true) {
    const state = normalizeState(parsed);
    writeState(state, dataKey);
    return state;
  }
  return normalizeState(decryptJson(parsed, dataKey));
}

function writeState(state, dataKey) {
  const tempPath = `${DATA_PATH}.tmp`;
  const encrypted = encryptJson(normalizeState(state), dataKey);
  fs.writeFileSync(tempPath, `${JSON.stringify(encrypted, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, DATA_PATH);
}

function encryptJson(value, dataKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: true,
    version: DATA_VERSION,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

function decryptJson(payload, dataKey) {
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext);
}

function deriveDataKey(password, salt) {
  return crypto.scryptSync(password, salt, 32);
}

function normalizeState(input) {
  return {
    ...seedState,
    ...(input && typeof input === "object" ? input : {}),
    projects: Array.isArray(input?.projects) ? input.projects : seedState.projects,
    tasks: Array.isArray(input?.tasks) ? input.tasks : seedState.tasks,
    activity: Array.isArray(input?.activity) ? input.activity : []
  };
}

function getSession(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

function getSessionToken(req) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === "focus_session") return value.join("=");
  }
  return null;
}

function buildSessionCookie(req, token) {
  const secure = req.socket.encrypted || req.headers["x-forwarded-proto"] === "https";
  return `focus_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure ? "; Secure" : ""}`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = "";
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Payload muito grande."));
        return;
      }
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(a, b) {
  const first = Buffer.from(String(a), "hex");
  const second = Buffer.from(String(b), "hex");
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(text);
}
