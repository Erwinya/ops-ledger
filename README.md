# Ops Ledger

A compact operations ledger web app inspired by multi-page banking demos:

- hash routing (`login`, `dashboard`, `transactions`, `transfer`)
- form handling and validation messages
- persistent local state (`localStorage`)

## Status

State helpers (`js/store.js`) for load/save, login, logout, and transfer are in place. Demo UI and styles will land in follow-up commits.

Demo credentials: `demo` / `ledger123`

## Module

```js
import { loadState, login, transfer, currentUser } from "./js/store.js";

const state = loadState();
login(state, "demo", "ledger123");
```

## Planned run

```powershell
python -m http.server 5190
```

Then open http://localhost:5190

## License

MIT
