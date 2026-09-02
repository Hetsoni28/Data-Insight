const fs = require("fs");

// DatasetDetailExplorer.tsx
let explorer = fs.readFileSync("frontend/src/components/organisms/DatasetDetailExplorer.tsx", "utf8");
explorer = explorer.replace('datasetId={params.id} />', 'initialDatasetId={params.id} onScheduleCreated={() => {}} />');
fs.writeFileSync("frontend/src/components/organisms/DatasetDetailExplorer.tsx", explorer);

// DatasetAlertsModal.tsx
let alerts = fs.readFileSync("frontend/src/components/organisms/DatasetAlertsModal.tsx", "utf8");
alerts = alerts.replace('onValueChange={setColumn}', 'onValueChange={(v) => setColumn(v || "")}');
alerts = alerts.replace('onValueChange={setCondition}', 'onValueChange={(v) => setCondition(v || "")}');
fs.writeFileSync("frontend/src/components/organisms/DatasetAlertsModal.tsx", alerts);

// DatasetComparisonView.tsx
let comp = fs.readFileSync("frontend/src/components/organisms/DatasetComparisonView.tsx", "utf8");
comp = comp.replace('onValueChange={setCompareDatasetId}', 'onValueChange={(v) => setCompareDatasetId(v || "")}');
comp = comp.replace('onValueChange={setMetricColumn}', 'onValueChange={(v) => setMetricColumn(v || "")}');
fs.writeFileSync("frontend/src/components/organisms/DatasetComparisonView.tsx", comp);

console.log("Fixed Explorer, Alerts, and Comparison");
