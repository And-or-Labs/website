/* `npm run dev`: astro dev. The Cloudflare adapter runs the API routes in
   workerd with the bindings from wrangler.jsonc and secrets from .dev.vars,
   so the separate `wrangler pages dev` on :8788 is gone. Forwards argv and
   PORT (set by portless) to astro. */
import { spawn } from "node:child_process";

const extra = process.argv.slice(2);
const astroArgs = ["dev", ...extra];
const hasPort = extra.some((a) => a === "--port" || a.startsWith("--port="));
if (process.env.PORT && !hasPort) astroArgs.push("--port", process.env.PORT);

const child = spawn("npx", ["astro", ...astroArgs], { stdio: "inherit", env: process.env });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code, signal) => process.exit(signal ? 0 : (code ?? 1)));
