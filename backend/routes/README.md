# backend/routes/

These are the addresses the app talks to when it needs to send or fetch data from the server.

---

## What's available

**Plants** — When you add or update a plant in the app, it sends that information here so the server has a copy.

**Events** — Every time you water a plant, that gets sent here too.

**Analytics** — The app can ask the server for your health scores, watering trends, and a full export of all your data.

---

For the full technical breakdown — every endpoint, request shape, response format, and example — see [docs.md](docs.md).
