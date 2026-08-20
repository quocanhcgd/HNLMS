"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const startedAt = new Date().toISOString();
console.log(JSON.stringify({ service: "worker", status: "ready", startedAt }));
setInterval(() => undefined, 60_000);
