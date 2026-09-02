const fs = require("fs");
let file = fs.readFileSync("frontend/src/components/organisms/CopilotChat.tsx", "utf8");
file = file.replace('disabled={isStreamingRef.current}', 'disabled={false}');
file = file.replace('disabled={!input.trim() || isStreamingRef.current}', 'disabled={!input.trim()}');
fs.writeFileSync("frontend/src/components/organisms/CopilotChat.tsx", file);
