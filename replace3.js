import fs from 'fs';

let files = ['src/components/OrgStructure.tsx', 'src/components/PerformanceReview.tsx', 'src/components/SettingsDashboard.tsx', 'src/components/DevHub.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  if(file === 'src/components/PerformanceReview.tsx') {
    content = content.replace(/Skor Kemajuan OKR Otomatis/g, 'Skor Kemajuan Otomatis');
  } else if(file === 'src/components/OrgStructure.tsx') {
    content = content.replace(/penyelarasan OKR antar Sektor/g, 'penyelarasan antar Sektor');
    content = content.replace(/Penyelarasan OKR/g, 'Penyelarasan Strategi');
    content = content.replace(/OKR Alignment/g, 'Strategy Alignment');
    content = content.replace(/OKR yang belum mencapai ambang pencapaian/g, 'Item yang belum mencapai ambang pencapaian');
    content = content.replace(/dan OKR telah dikunci secara otomatis/g, 'dan indikator kinerja telah dikunci secara otomatis');
  } else if(file === 'src/components/SettingsDashboard.tsx') {
    content = content.replace(/melihat OKR dan progress seluruh karyawan/g, 'melihat indikator kinerja dan progress seluruh karyawan');
  } else if(file === 'src/components/DevHub.tsx') {
    content = content.replace(/metrik OKR otomatis ke siklus tertentu/g, 'metrik kinerja otomatis ke siklus tertentu');
    content = content.replace(/menyusun progres OKR berdasarkan bobot/g, 'menyusun progres indikator berdasarkan bobot');
  }

  fs.writeFileSync(file, content, 'utf-8');
});

console.log('Done replacement text');
