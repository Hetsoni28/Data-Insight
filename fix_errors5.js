const fs = require("fs");
let viewerAi = fs.readFileSync("frontend/src/components/organisms/ViewerAiAssistant.tsx", "utf8");
viewerAi = viewerAi.replace(
  'interface Message {\n  id: string;\n  role: "user" | "assistant";\n  content: string;\n  model?: string;\n  timestamp: Date;\n}',
  'interface Message {\n  id: string;\n  role: "user" | "assistant";\n  content: string;\n  model?: string;\n  timestamp: Date;\n  chartData?: any;\n  sqlQuery?: string;\n}'
);
fs.writeFileSync("frontend/src/components/organisms/ViewerAiAssistant.tsx", viewerAi);
