const fs = require("fs");
let comp = fs.readFileSync("frontend/src/components/organisms/DatasetComparisonView.tsx", "utf8");
comp = comp.replace(/onlyB\.map\(col =>/g, 'onlyB.map((col: any) =>');
comp = comp.replace(/sharedCols\.map\(col =>/g, 'sharedCols.map((col: any) =>');
comp = comp.replace(/onlyC\.map\(col =>/g, 'onlyC.map((col: any) =>');
fs.writeFileSync("frontend/src/components/organisms/DatasetComparisonView.tsx", comp);

// Also fix DataCleaningTab.tsx missing checkbox import
let clean = fs.readFileSync("frontend/src/components/organisms/DataCleaningTab.tsx", "utf8");
// The error was: Cannot find module '@/components/ui/checkbox'
// Check if Checkbox is used and change import or use native input.
// I will just remove the import if it's not actually a real module, wait, maybe ShadCN checkbox is in components/ui/checkbox.tsx?
// I will check if it exists.
