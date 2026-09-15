import type { IncomingMessage, ServerResponse } from "node:http";

import { app } from "../server/app";
import { registerRoutes } from "../server/routes";
import { connectDB } from "../server/mongodb";

// Vercel reuses this module across warm invocations of the same lambda,
// so routes are registered and the DB connection is attempted only once.
let ready: Promise<void> | null = null;

function initialize(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await registerRoutes(app);
    })();
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initialize();
  app(req, res);
}
