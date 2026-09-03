const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const PDFDocument = require("pdfkit");
const { URL } = require("url");
const {
  hasUsers,
  createInitialAccount,
  authenticateUser,
  createInvite,
  acceptInvite,
  resetPasswordWithRecovery,
  listMembers,
  readTenantState,
  writeTenantState
} = require("./database");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_BODY_BYTES = 1024 * 1024;

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

const seedState = null;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/setup" && req.method === "GET") return handleSetup(req, res);
    if (url.pathname === "/api/register" && req.method === "POST") return handleRegister(req, res);
    if (url.pathname === "/api/invites/accept" && req.method === "POST") return handleAcceptInvite(req, res);
    if (url.pathname === "/api/recovery/reset" && req.method === "POST") return handleRecoveryReset(req, res);
    if (url.pathname === "/api/login" && req.method === "POST") return handleLogin(req, res);
    if (url.pathname === "/api/logout" && req.method === "POST") return handleLogout(req, res);
    if (url.pathname === "/api/session" && req.method === "GET") return handleSession(req, res);
    if (url.pathname === "/api/members" && req.method === "GET") return handleMembers(req, res);
    if (url.pathname === "/api/invites" && req.method === "POST") return handleCreateInvite(req, res);
    if (url.pathname === "/api/state" && req.method === "GET") return handleGetState(req, res);
    if (url.pathname === "/api/state" && req.method === "PUT") return handlePutState(req, res);
    if (url.pathname === "/api/reports/finance.pdf" && req.method === "GET") return handleFinanceReport(req, res, url);
    if (url.pathname.startsWith("/api/")) return sendJson(res, 404, { message: "Rota nao encontrada." });

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, error.statusCode || 500, { message: error.statusCode ? error.message : "Erro interno do servidor." });
  }
});

server.listen(PORT, () => {
  console.log(`Focus rodando em http://localhost:${PORT}`);
});

async function handleSetup(req, res) {
  return sendJson(res, 200, { ok: true, needsSetup: !(await hasUsers()) });
}

async function handleRegister(req, res) {
  if (await hasUsers()) return sendJson(res, 409, { message: "Cadastro inicial ja foi criado. Use um convite para adicionar familiares." });
  const body = await readJsonBody(req);
  validateNameEmailPassword(body);
  const result = await createInitialAccount({
    name: body.name,
    email: body.email,
    password: body.password,
    tenantName: body.tenantName || "Familia"
  });
  const session = {
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    tenantId: result.tenant.id,
    tenantName: result.tenant.name,
    role: "owner"
  };
  setSession(req, res, session);
  return sendJson(res, 201, { ok: true, session, recoveryCode: result.recoveryCode });
}

async function handleAcceptInvite(req, res) {
  const body = await readJsonBody(req);
  validateNameEmailPassword(body);
  if (!body.inviteCode) return sendJson(res, 400, { message: "Informe o codigo do convite." });
  const result = await acceptInvite(body);
  if (!result) return sendJson(res, 400, { message: "Convite invalido ou expirado." });
  return sendJson(res, 201, { ok: true, recoveryCode: result.recoveryCode });
}

async function handleRecoveryReset(req, res) {
  const body = await readJsonBody(req);
  if (!body.email || !body.recoveryCode || !body.newPassword || String(body.newPassword).length < 8) {
    return sendJson(res, 400, { message: "Informe email, codigo de recuperacao e nova senha com pelo menos 8 caracteres." });
  }
  const result = await resetPasswordWithRecovery(body);
  if (!result) return sendJson(res, 401, { message: "Codigo de recuperacao invalido." });
  return sendJson(res, 200, { ok: true, recoveryCode: result.recoveryCode });
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  if (!body.email || !body.password) return sendJson(res, 400, { message: "Informe email e senha." });
  const session = await authenticateUser(body.email, body.password);
  if (!session) return sendJson(res, 401, { message: "Email ou senha invalidos." });
  setSession(req, res, session);
  return sendJson(res, 200, { ok: true, session });
}

function handleLogout(req, res) {
  const token = getSessionToken(req);
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "focus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  return sendJson(res, 200, { ok: true });
}

function handleSession(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  return sendJson(res, 200, { ok: true, session });
}

async function handleMembers(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  return sendJson(res, 200, { ok: true, members: await listMembers(session) });
}

async function handleCreateInvite(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  const body = await readJsonBody(req);
  if (!body.email) return sendJson(res, 400, { message: "Informe o email do familiar." });
  const invite = await createInvite(session, body.email);
  return sendJson(res, 201, { ok: true, invite });
}

async function handleGetState(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  const data = await readTenantState(session, seedState);
  return sendJson(res, 200, { ok: true, data, session });
}

async function handlePutState(req, res) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  const state = await readJsonBody(req);
  await writeTenantState(session, state);
  return sendJson(res, 200, { ok: true });
}

async function handleFinanceReport(req, res, url) {
  const session = getSession(req);
  if (!session) return sendJson(res, 401, { message: "Nao autenticado." });
  const month = /^\d{4}-\d{2}$/.test(url.searchParams.get("month")) ? url.searchParams.get("month") : monthKey(new Date());
  const state = await readTenantState(session, seedState) || {};
  const finance = state.finance || {};
  const accounts = new Map((finance.accounts || []).map((item) => [item.id, item.name || "Conta"]));
  const categories = new Map((finance.categories || []).map((item) => [item.id, item]));
  const transactions = (finance.transactions || [])
    .filter((item) => (item.competenceMonth || String(item.dueDate || item.date || "").slice(0, 7)) === month)
    .sort((left, right) => String(left.dueDate || left.date).localeCompare(String(right.dueDate || right.date)));
  const paid = transactions.filter((item) => item.status === "pago");
  const pending = transactions.filter((item) => item.status !== "pago");
  const sum = (items) => items.reduce((total, item) => total + Number(item.amount || item.value || 0), 0);
  const signedSum = (items) => items.reduce((total, item) => total + (item.type === "receita" ? 1 : -1) * Number(item.amount || item.value || 0), 0);
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
  const filename = `prestacao-de-contas-${month}.pdf`;
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store"
  });
  doc.pipe(res);
  doc.fontSize(20).fillColor("#15352b").text("Prestacao de contas", { continued: false });
  doc.fontSize(11).fillColor("#5e6f67").text(`Competencia: ${formatMonthLabel(month)} | Gerado em ${formatDate(new Date())}`);
  doc.moveDown(1);
  writeReportSection(doc, "Lancamentos pagos", paid, accounts, categories);
  doc.fontSize(11).fillColor("#1b7f59").text(`Subtotal pago: ${formatCurrency(sum(paid))}`);
  doc.moveDown(1);
  writeReportSection(doc, "Lancamentos pendentes", pending, accounts, categories);
  doc.fontSize(11).fillColor("#b23b32").text(`Subtotal a pagar: ${formatCurrency(sum(pending))}`);
  doc.moveDown(1);
  doc.fontSize(13).fillColor("#15352b").text("Resumo financeiro");
  doc.fontSize(11).fillColor("#26342e").text(`Total de lancamentos: ${transactions.length}`);
  doc.text(`Total pago: ${formatCurrency(sum(paid))}`);
  doc.text(`Total a pagar: ${formatCurrency(sum(pending))}`);
  doc.text(`Saldo liquido dos lancamentos: ${formatCurrency(signedSum(transactions))}`);
  doc.end();
}

function writeReportSection(doc, title, transactions, accounts, categories) {
  doc.fontSize(13).fillColor("#15352b").text(title);
  if (!transactions.length) {
    doc.fontSize(10).fillColor("#5e6f67").text("Nenhum lancamento.");
    return;
  }
  transactions.forEach((item) => {
    if (doc.y > 730) doc.addPage();
    const category = categories.get(item.categoryId);
    const subcategory = (category?.subcategories || []).find((entry) => (entry.id || entry) === (item.subcategoryId || item.subcategory));
    const categoryLabel = subcategory ? `${category?.name || "Sem categoria"} / ${subcategory.name || subcategory}` : category?.name || "Sem categoria";
    const amount = formatCurrency(Number(item.amount || item.value || 0));
    const due = formatDate(item.dueDate || item.date);
    const paidAt = item.status === "pago" ? formatDate(item.paidAt || item.date) : "-";
    doc.moveDown(0.35).fontSize(10).fillColor("#26342e").text(`${item.description || "Lancamento"}  |  ${item.type === "receita" ? "Receita" : "Despesa"}  |  ${amount}`);
    doc.fontSize(9).fillColor("#5e6f67").text(`Vencimento: ${due} | Pagamento: ${paidAt} | Conta: ${accounts.get(item.accountId) || "-"}`);
    doc.text(`Categoria: ${categoryLabel}${item.note ? ` | Obs.: ${item.note}` : ""}`);
    doc.moveTo(42, doc.y + 4).lineTo(553, doc.y + 4).strokeColor("#d8e1dc").stroke();
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

function formatMonthLabel(value) {
  const date = new Date(`${value}-01T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function monthKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
  const relative = path.relative(ROOT, filePath).toLowerCase();
  return name.startsWith(".") ||
    name === "server.js" ||
    name === "database.js" ||
    name === "data.json" ||
    name.endsWith(".db") ||
    name.endsWith(".sqlite") ||
    name === "config.server.json" ||
    name === "package.json" ||
    relative.startsWith(`data${path.sep}`) ||
    relative.includes(`${path.sep}.git${path.sep}`) ||
    relative.includes(`${path.sep}node_modules${path.sep}`);
}

function validateNameEmailPassword(body) {
  if (!body.name || String(body.name).trim().length < 2) throwBadRequest("Informe o nome.");
  if (!body.email || !String(body.email).includes("@")) throwBadRequest("Informe um email valido.");
  if (!body.password || String(body.password).length < 8) throwBadRequest("A senha precisa ter pelo menos 8 caracteres.");
}

function throwBadRequest(message) {
  throw Object.assign(new Error(message), { statusCode: 400 });
}

function setSession(req, res, session) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...session, expiresAt: Date.now() + SESSION_TTL_MS });
  res.setHeader("Set-Cookie", buildSessionCookie(req, token));
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

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(text);
}
