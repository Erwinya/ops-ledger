import {
  currentUser,
  loadState,
  login,
  logout,
  transfer,
} from "./store.js";

const app = document.getElementById("app");
let state = loadState();

function route() {
  const hash = location.hash.replace(/^#\/?/, "") || "dashboard";
  if (!state.session && hash !== "login") {
    location.hash = "#/login";
    return;
  }
  if (state.session && hash === "login") {
    location.hash = "#/dashboard";
    return;
  }
  const view = {
    login: renderLogin,
    dashboard: renderDashboard,
    transactions: renderTransactions,
    transfer: renderTransfer,
  }[hash] || renderDashboard;
  app.innerHTML = view();
  bindCommon();
}

function shell(active, body) {
  const session = state.session;
  return `
    <div class="shell">
      <header class="nav">
        <div class="brand">Ops Ledger</div>
        <nav class="nav-links">
          ${
            session
              ? `
            <a href="#/dashboard" class="${active === "dashboard" ? "active" : ""}">Dashboard</a>
            <a href="#/transactions" class="${active === "transactions" ? "active" : ""}">Transactions</a>
            <a href="#/transfer" class="${active === "transfer" ? "active" : ""}">Transfer</a>
            <button type="button" class="btn subtle" id="logout">Sign out</button>
          `
              : `<span class="mono">demo / ledger123</span>`
          }
        </nav>
      </header>
      <main class="panel">${body}</main>
    </div>
  `;
}

function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function renderLogin() {
  return shell(
    "login",
    `
    <h1>Sign in</h1>
    <p class="lede">Local demo ledger with routing, forms, and persistent state.</p>
    <form class="form" id="login-form">
      <label>Username<input name="username" value="demo" autocomplete="username" required /></label>
      <label>Password<input name="password" type="password" value="ledger123" autocomplete="current-password" required /></label>
      <p class="error" id="login-error" role="alert" aria-live="polite"></p>
      <button class="btn" type="submit">Continue</button>
    </form>
  `,
  );
}

function renderDashboard() {
  const user = currentUser(state);
  const credits = user.transactions.filter((t) => t.type === "credit").length;
  const debits = user.transactions.filter((t) => t.type === "debit").length;
  return shell(
    "dashboard",
    `
    <h1>Welcome, ${user.name}</h1>
    <p class="lede">Account overview for local operations tracking.</p>
    <div class="stats">
      <div class="stat"><div class="label">Balance</div><div class="value">${money(user.balance)}</div></div>
      <div class="stat"><div class="label">Credits</div><div class="value">${credits}</div></div>
      <div class="stat"><div class="label">Debits</div><div class="value">${debits}</div></div>
    </div>
    <p><a href="#/transactions">View recent transactions â†’</a></p>
  `,
  );
}

function renderTransactions() {
  const user = currentUser(state);
  const rows = user.transactions
    .map(
      (t) => `
      <tr>
        <td class="mono">${t.date}</td>
        <td>${t.label}</td>
        <td class="${t.type === "credit" ? "credit" : "debit"}">${money(t.amount)}</td>
      </tr>`,
    )
    .join("");
  return shell(
    "transactions",
    `
    <h1>Transactions</h1>
    <p class="lede">Newest activity first.</p>
    <table>
      <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

function renderTransfer() {
  return shell(
    "transfer",
    `
    <h1>Transfer</h1>
    <p class="lede">Record an outbound transfer against the demo balance.</p>
    <form class="form" id="transfer-form">
      <label>Destination<input name="to" placeholder="Ops-AP-8841" required /></label>
      <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
      <label>Note<input name="note" placeholder="Optional memo" /></label>
      <p class="error" id="transfer-error" role="alert" aria-live="polite"></p>
      <button class="btn" type="submit">Submit transfer</button>
    </form>
  `,
  );
}

function bindCommon() {
  document.getElementById("logout")?.addEventListener("click", () => {
    logout(state);
    location.hash = "#/login";
  });

  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const result = login(state, String(data.get("username")).trim(), String(data.get("password")));
    if (!result.ok) {
      document.getElementById("login-error").textContent = result.error;
      return;
    }
    state = loadState();
    location.hash = "#/dashboard";
  });

  document.getElementById("transfer-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const result = transfer(state, {
      to: String(data.get("to")),
      amount: Number(data.get("amount")),
      note: String(data.get("note") || ""),
    });
    if (!result.ok) {
      document.getElementById("transfer-error").textContent = result.error;
      return;
    }
    state = loadState();
    location.hash = "#/transactions";
  });
}

window.addEventListener("hashchange", route);
route();
