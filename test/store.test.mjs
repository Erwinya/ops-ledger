import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentUser,
  filterTransactions,
  loadState,
  login,
  logout,
  postTransaction,
  summarizeTransactions,
  transfer,
} from "../js/store.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function freshState() {
  globalThis.localStorage = memoryStorage();
  return loadState();
}

test("loadState returns defaults and recovers from corrupt JSON", () => {
  globalThis.localStorage = memoryStorage();
  const a = loadState();
  assert.equal(a.session, null);
  assert.ok(a.users.demo);

  localStorage.setItem("ops-ledger-v1", "{not-json");
  const b = loadState();
  assert.equal(b.users.demo.name, "Demo Operator");
});

test("login logout and currentUser", () => {
  const state = freshState();
  assert.equal(login(state, "demo", "wrong").ok, false);
  assert.equal(login(state, "demo", "ledger123").ok, true);
  assert.equal(currentUser(state).name, "Demo Operator");
  logout(state);
  assert.equal(currentUser(state), null);
});

test("postTransaction credits and debits with balance updates", () => {
  const state = freshState();
  login(state, "demo", "ledger123");
  const before = currentUser(state).balance;

  const credit = postTransaction(state, { amount: 100, label: "Bonus" });
  assert.equal(credit.ok, true);
  assert.equal(credit.transaction.type, "credit");
  assert.equal(currentUser(state).balance, Number((before + 100).toFixed(2)));

  const debit = postTransaction(state, { amount: -40, label: "Fee" });
  assert.equal(debit.ok, true);
  assert.equal(debit.transaction.type, "debit");
  assert.equal(currentUser(state).transactions[0].label, "Fee");
});

test("postTransaction rejects invalid entries", () => {
  const state = freshState();
  login(state, "demo", "ledger123");
  const count = currentUser(state).transactions.length;
  assert.equal(postTransaction(state, { amount: 0, label: "x" }).ok, false);
  assert.equal(postTransaction(state, { amount: 10, label: "  " }).ok, false);
  assert.equal(currentUser(state).transactions.length, count);
});

test("transfer requires destination and sufficient funds", () => {
  const state = freshState();
  login(state, "demo", "ledger123");
  assert.equal(transfer(state, { to: "", amount: 10 }).ok, false);
  assert.equal(transfer(state, { to: "AP-1", amount: 999999 }).ok, false);
  const ok = transfer(state, { to: "AP-1", amount: 10, note: "Pay vendor" });
  assert.equal(ok.ok, true);
  assert.equal(currentUser(state).transactions[0].type, "debit");
});

test("filterTransactions supports text type and date range", () => {
  const txs = [
    { date: "2026-08-01", label: "Opening balance", type: "credit", amount: 1 },
    { date: "2026-08-03", label: "Vendor payment", type: "debit", amount: -1 },
    { date: "2026-08-05", label: "Client remittance", type: "credit", amount: 2 },
  ];
  assert.equal(filterTransactions(txs, { query: "vendor" }).length, 1);
  assert.equal(filterTransactions(txs, { type: "credit" }).length, 2);
  assert.equal(filterTransactions(txs, { from: "2026-08-03", to: "2026-08-04" }).length, 1);
  assert.equal(filterTransactions(txs, { query: "client", type: "credit" }).length, 1);
});

test("summarizeTransactions counts credits and debits", () => {
  const summary = summarizeTransactions([
    { type: "credit", amount: 10 },
    { type: "debit", amount: -4 },
    { type: "credit", amount: 2 },
  ]);
  assert.equal(summary.credits, 2);
  assert.equal(summary.debits, 1);
  assert.equal(summary.creditTotal, 12);
  assert.equal(summary.debitTotal, 4);
  assert.equal(summary.count, 3);
});
