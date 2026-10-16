# Ops Ledger

A compact operations ledger web app inspired by multi-page banking demos:

- hash routing (`login`, `dashboard`, `transactions`, `transfer`)
- form handling and validation messages
- persistent local state (`localStorage`)

## Status

Demo app, styles, and CI checks are in place.

Demo credentials: `demo` / `ledger123`

## Run

```powershell
python -m http.server 5190
```

Then open http://localhost:5190

## Module

```js
import { loadState, login, transfer, currentUser } from "./js/store.js";

const state = loadState();
login(state, "demo", "ledger123");
```

## License

MIT
