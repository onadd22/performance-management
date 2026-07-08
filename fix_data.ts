import fs from "fs";

const file = "src/mockData.ts";
let content = fs.readFileSync(file, "utf8");
content = content.replace(/isShared:\s*true,/g, "isShared: true,\n    weight: 100,");
content = content.replace(/isShared:\s*false,/g, "isShared: false,\n    weight: 100,");
fs.writeFileSync(file, content);
console.log("Fixed mockData.ts");
