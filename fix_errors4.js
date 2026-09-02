const fs = require("fs");
let cards = fs.readFileSync("frontend/src/components/organisms/OrganizationScoreCards.tsx", "utf8");
cards = cards.replace(
  'interface Overview {\n  subscription_plan: string\n  subscription_status: string\n  current_ai_provider: string\n}',
  'interface Overview {\n  subscription_plan: string\n  subscription_status: string\n  current_ai_provider: string\n  mrr?: number\n  current_period_end?: string\n}'
);
fs.writeFileSync("frontend/src/components/organisms/OrganizationScoreCards.tsx", cards);
