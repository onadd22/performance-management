import fs from 'fs';
const content = fs.readFileSync('src/components/PerformanceReview.tsx', 'utf-8');

let lines = content.split('\n');

let wizardStart = lines.findIndex(l => l.includes('{/* INTEGRATED INTEGRATION LIFECYCLE GUIDE & ACTION STEPPER */}'));
let dashboardStart = lines.findIndex(l => l.includes('{/* DASHBOARD ANALYTICS SECTION */}'));

if (wizardStart !== -1 && dashboardStart !== -1) {
  lines.splice(wizardStart, dashboardStart - wizardStart);
}

let boxStart = lines.findIndex(l => l.includes('{/* 9-BOX INTERACTIVE TALENT MATRIX GRID */}'));
let filterStart = lines.findIndex(l => l.includes('{/* FILTER BAR PANEL */}'));

if (boxStart !== -1 && filterStart !== -1) {
  lines.splice(boxStart, filterStart - boxStart);
}

fs.writeFileSync('src/components/PerformanceReview.tsx', lines.join('\n'));
