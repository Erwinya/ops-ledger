const STORAGE_KEY = "ops-ledger-v1";

const defaultState = () => ({
  session: null,
  users: {
    demo: {
      password: "ledger123",
      name: "Demo Operator",
      balance: 12500.5,
      transactions: [
        { id: "tx-1", date: "2026-08-01", label: "Opening balance", amount: 10000, type: "credit" },
        { id: "tx-2", date: "2026-08-03", label: "Vendor payment", amount: -420.25, type: "debit" },
        { id: "tx-3", date: "2026-08-05", label: "Client remittance", amount: 2920.75, type: "credit" },
      ],
    },
  },
});

let txSeq = 0;

function nextTxId() {
  txSeq += 1;
  return `tx-${Date.now()}-${txSeq}`;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function login(state, username, password) {
  const user = state.users[username];
  if (!user || user.password !== password) {
    return { ok: false, error: "Invalid username or password." };
  }
  state.session = { username, name: user.name };
  saveState(state);
  return { ok: true };
}

export function logout(state) {
  state.session = null;
  saveState(state);
}

export function currentUser(state) {
  if (!state.session) return null;
  return state.users[state.session.username] || null;
}

/** Post a signed amount (positive = credit, negative = debit). */
export function postTransaction(state, { amount, label, date } = {}) {
  const user = currentUser(state);
  if (!user) return { ok: false, error: "Not signed in." };
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false, error: "Enter a non-zero amount." };
  }
  const description = String(label ?? "").trim();
  if (!description) {
    return { ok: false, error: "Description is required." };
  }
  const signed = Number(amount.toFixed(2));
  const tx = {
    id: nextTxId(),
    date: date || new Date().toISOString().slice(0, 10),
    label: description,
    amount: signed,
    type: signed > 0 ? "credit" : "debit",
  };
  user.transactions = [tx, ...user.transactions];
  user.balance = Number((user.balance + signed).toFixed(2));
  saveState(state);
  return { ok: true, transaction: tx };
}

export function transfer(state, { to, amount, note }) {
  const destination = String(to ?? "").trim();
  if (!destination) {
    return { ok: false, error: "Destination is required." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }
  const user = currentUser(state);
  if (!user) return { ok: false, error: "Not signed in." };
  if (amount > user.balance) {
    return { ok: false, error: "Insufficient balance." };
  }
  const label = String(note ?? "").trim() || `Transfer to ${destination}`;
  return postTransaction(state, { amount: -amount, label });
}

export function filterTransactions(transactions, { query = "", type = "all", from = "", to = "" } = {}) {
  const q = String(query).trim().toLowerCase();
  return (transactions || []).filter((tx) => {
    if (type === "credit" || type === "debit") {
      if (tx.type !== type) return false;
    }
    if (from && tx.date < from) return false;
    if (to && tx.date > to) return false;
    if (q && !String(tx.label).toLowerCase().includes(q)) return false;
    return true;
  });
}

export function summarizeTransactions(transactions) {
  let credits = 0;
  let debits = 0;
  let creditTotal = 0;
  let debitTotal = 0;
  for (const tx of transactions || []) {
    if (tx.type === "credit") {
      credits += 1;
      creditTotal += tx.amount;
    } else if (tx.type === "debit") {
      debits += 1;
      debitTotal += Math.abs(tx.amount);
    }
  }
  return { credits, debits, creditTotal, debitTotal, count: credits + debits };
}
