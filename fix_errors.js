const fs = require("fs");

// 1. AIForecastTab.tsx
let forecast = fs.readFileSync("frontend/src/components/organisms/AIForecastTab.tsx", "utf8");
forecast = forecast.replace('import { toast } from "react-hot-toast"', 'import { toast } from "sonner"');
forecast = forecast.replace('onValueChange={setDateCol}', 'onValueChange={(v) => setDateCol(v || "")}');
forecast = forecast.replace('onValueChange={setMetricCol}', 'onValueChange={(v) => setMetricCol(v || "")}');
forecast = forecast.replace('onValueChange={setHorizon}', 'onValueChange={(v) => setHorizon(v || "6")}');
fs.writeFileSync("frontend/src/components/organisms/AIForecastTab.tsx", forecast);

// 2. DatasetDetailTabs.tsx
let tabs = fs.readFileSync("frontend/src/components/organisms/DatasetDetailTabs.tsx", "utf8");
tabs = tabs.replace('<DataCleaningTab datasetId={datasetId} schema={schema} />', '<DataCleaningTab datasetId={datasetId} />');
fs.writeFileSync("frontend/src/components/organisms/DatasetDetailTabs.tsx", tabs);

// 3. DynamicNLChart.tsx
let chart = fs.readFileSync("frontend/src/components/organisms/DynamicNLChart.tsx", "utf8");
chart = chart.replace(/cell/g, 'Cell');
chart = chart.replace(/\$index/g, 'index');
// Fix the casing back if 'Cell' was already uppercase
chart = chart.replace(/CCell/g, 'Cell');
fs.writeFileSync("frontend/src/components/organisms/DynamicNLChart.tsx", chart);

console.log("Fixed AIForecastTab, DatasetDetailTabs, and DynamicNLChart");
