import fs from 'fs';

let content = fs.readFileSync('src/components/OkrDashboard.tsx', 'utf-8');

const replacements = [
  { from: 'Tipe OKR (Keselarasan Governance) *', to: 'Tipe {methodTermLabel} (Keselarasan Governance) *' },
  { from: 'Tipe OKR', to: 'Tipe {methodTermLabel}' },
  { from: 'Approver OKR (Opsional)', to: 'Approver {methodTermLabel} (Opsional)' },
  { from: 'Ubah OKR', to: 'Ubah {methodTermLabel}' },
  { from: 'Deklarasikan OKR Objective', to: 'Deklarasikan {methodTerms.objectiveLabel}' },
  { from: 'Aktifkan Pembagian Kontribusi (Shared OKR)', to: 'Aktifkan Pembagian Kontribusi (Shared {methodTermLabel})' },
  { from: 'Committed OKRs', to: 'Committed {methodTermLabel}s' }
];

replacements.forEach(r => {
  content = content.split(r.from).join(r.to);
});

fs.writeFileSync('src/components/OkrDashboard.tsx', content, 'utf-8');
console.log('Done replacement');
