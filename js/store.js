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

export function transfer(state, { to, amount, note }) {
  const user = currentUser(state);
  if (!user) return { ok: false, error: "Not signed in." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }
  if (amount > user.balance) {
    return { ok: false, error: "Insufficient balance." };
  }
  const label = note?.trim() || `Transfer to ${to || "external account"}`;
  const tx = {
    id: `tx-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    label,
    amount: -amount,
    type: "debit",
  };
  user.transactions = [tx, ...user.transactions];
  user.balance = Number((user.balance - amount).toFixed(2));
  saveState(state);
  return { ok: true };
}
