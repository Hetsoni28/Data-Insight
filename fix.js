const fs = require('fs');
const path = require('path');
const dir = './frontend/src/components/organisms/analytics';
const files = fs.readdirSync(dir).filter(f => f.startsWith('ViewerAnalytics') && f !== 'ViewerAnalyticsCenter.tsx');

files.forEach(f => {
  const filePath = path.join(dir, f);
  let c = fs.readFileSync(filePath, 'utf8');
  
  // Fix React imports injected wrongly into other libraries
  c = c.replace(/import React, \{([^}]+)\} from ["']framer-motion["'];/g, 'import { $1 } from "framer-motion";');
  c = c.replace(/import React, \{([^}]+)\} from ["']lucide-react["'];/g, 'import { $1 } from "lucide-react";');
  c = c.replace(/import React, \{([^}]+)\} from ["']recharts["'];/g, 'import { $1 } from "recharts";');
  c = c.replace(/import React, \{([^}]+)\} from ["']@\/components\/ui\/card["'];/g, 'import { $1 } from "@/components/ui/card";');
  
  // Ensure React is imported
  if (!c.includes('from "react"') && !c.includes("from 'react'") && !c.includes('import React from "react"')) {
    c = 'import React from "react";\n' + c;
  }
  
  fs.writeFileSync(filePath, c);
  console.log('Fixed ' + f);
});
