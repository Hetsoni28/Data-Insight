const fs = require("fs");
const path = "frontend/src/hooks/useWebSocket.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  'export function useWebSocket(onMessage?: (event: WebSocketEvent) => void) {',
  'export function useWebSocket({ onMessage }: { onMessage?: (event: WebSocketEvent) => void } = {}) {'
);

fs.writeFileSync(path, content);
console.log("Fixed useWebSocket signature");
