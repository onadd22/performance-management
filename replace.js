import fs from 'fs';

let content = fs.readFileSync('src/components/OkrDashboard.tsx', 'utf-8');

const replacements = [
  { from: 'Klinik Edukasi OKR', to: 'Klinik Edukasi {methodTermLabel}' },
  { from: 'OKR Trainer Clinic', to: '{methodTermLabel} Trainer Clinic' },
  { from: 'Klinik Edukasi & Panduan Praktis OKR', to: 'Klinik Edukasi & Panduan Praktis {methodTermLabel}' },
  { from: 'OKR Education Clinic & Practical Guide', to: '{methodTermLabel} Education Clinic & Practical Guide' },
  { from: 'Mari buat sistem OKR yang sederhana', to: 'Mari buat sistem {methodTermLabel} yang sederhana' },
  { from: 'Let us build a simple, transparent, and focused OKR system', to: 'Let us build a simple, transparent, and focused {methodTermLabel} system' },
  { from: 'Tips Formula OKR:', to: 'Tips Formula {methodTermLabel}:' },
  { from: 'aksi modifikasi OKR', to: 'aksi modifikasi {methodTermLabel}' },
  { from: '! OKR yang belum mencapai', to: '! Item {methodTermLabel} yang belum mencapai' },
  { from: '! OKRs not meeting', to: '! {methodTermLabel} items not meeting' },
  { from: 'Tabel OKR Pribadi & Update', to: 'Tabel {methodTermLabel} Pribadi & Update' },
  { from: 'Edu OKR', to: 'Edu {methodTermLabel}' },
  { from: 'Filter Tampilan Data OKR & Riwayat:', to: 'Filter Tampilan Data {methodTermLabel} & Riwayat:' },
  { from: 'Pilih Profil Karyawan Pengampu OKR', to: 'Pilih Profil Karyawan Pengampu {methodTermLabel}' },
  { from: 'Ringkasan Kinerja & Evaluasi OKR', to: 'Ringkasan Kinerja & Evaluasi {methodTermLabel}' },
  { from: 'Average OKR Score', to: 'Average {methodTermLabel} Score' },
  { from: '"Item OKR (Key Result & Induk Objective)"', to: '`Item ${methodTermLabel} (${methodTerms.keyResultLabel} & Induk ${methodTerms.objectiveLabel})`' },
  { from: '"Tipe OKR"', to: '`Tipe ${methodTermLabel}`' },
  { from: 'Realisasi Aktual OKR', to: 'Realisasi Aktual {methodTermLabel}' },
  { from: '"Deklarasikan OKR Objective"', to: '`Deklarasikan ${methodTerms.objectiveLabel}`' },
  { from: '"Approver OKR (Opsional)"', to: '`Approver ${methodTermLabel} (Opsional)`' },
  { from: '"Tipe OKR (Keselarasan Governance) *"', to: '`Tipe ${methodTermLabel} (Keselarasan Governance) *`' },
  { from: '"Aktifkan Pembagian Kontribusi (Shared OKR)"', to: '`Aktifkan Pembagian Kontribusi (Shared ${methodTermLabel})`' },
  { from: 'Bila OKR ini ditanggung', to: 'Bila item {methodTermLabel} ini ditanggung' },
  { from: '"Ubah OKR"', to: '`Ubah ${methodTermLabel}`' },
  { from: 'untuk semua OKR.', to: 'untuk semua {methodTermLabel}.' },
  { from: 'for all OKRs.', to: 'for all {methodTermLabel} items.' },
  { from: 'periode OKR.', to: 'periode {methodTermLabel}.' },
  { from: 'the OKR period.', to: 'the {methodTermLabel} period.' },
  { from: '"Target OKR Komitmen %"', to: '`Target ${methodTermLabel} Komitmen %`' },
  { from: 'untuk OKR Komitmen,', to: 'untuk {methodTermLabel} Komitmen,' },
  { from: 'for Committed OKRs,', to: 'for Committed {methodTermLabel} items,' },
  { from: '"Target OKR Aspirasional %"', to: '`Target ${methodTermLabel} Aspirasional %`' },
  { from: 'untuk OKR Aspirasional', to: 'untuk {methodTermLabel} Aspirasional' },
  { from: 'for Aspirational OKRs', to: 'for Aspirational {methodTermLabel} items' },
  { from: 'Commitment OKRs', to: 'Commitment {methodTermLabel}s' },
  { from: 'Aspirational OKRs', to: 'Aspirational {methodTermLabel}s' },
  { from: 'Metode OKR', to: 'Metode {methodTermLabel}' },
  { from: 'OKR (John Doerr)', to: '{methodTermLabel}' },
  { from: 'Dashboard OKR Transparan', to: 'Dashboard {methodTermLabel} Transparan' },
  { from: 'Transparent OKR Dashboard', to: 'Transparent {methodTermLabel} Dashboard' },
  { from: 'Kemajuan OKR', to: 'Kemajuan {methodTermLabel}' },
  { from: 'OKR Progress', to: '{methodTermLabel} Progress' },
  { from: 'Panduan Praktis Belajar & Memahami OKR', to: 'Panduan Praktis Belajar & Memahami {methodTermLabel}' },
  { from: 'Practical Guide to Learning & Understanding OKRs', to: 'Practical Guide to Learning & Understanding {methodTermLabel}s' },
  { from: '1. Mengapa OKR Sangat Sukses', to: '1. Mengapa {methodTermLabel} Sangat Sukses' },
  { from: '**superpower OKR**', to: '**superpower {methodTermLabel}**' },
  { from: '3. Menyelaraskan OKR Sesuai', to: '3. Menyelaraskan {methodTermLabel} Sesuai' },
  { from: 'Ada dua jenis OKR yang kami', to: 'Ada dua jenis {methodTermLabel} yang kami' },
  { from: '4. Tips Rahasia Memulai OKR', to: '4. Tips Rahasia Memulai {methodTermLabel}' },
  { from: '4. Secret Tips for OKR', to: '4. Secret Tips for {methodTermLabel}' },
  { from: 'Bila Anda baru mulai belajar OKR,', to: 'Bila Anda baru mulai belajar {methodTermLabel},' },
  { from: 'MODAL POPUP: KIRIM CEPAT CHECK-IN OKR (INDIVIDUAL)', to: 'MODAL POPUP: KIRIM CEPAT CHECK-IN {methodTermLabel} (INDIVIDUAL)' },
  { from: 'Skor Desimal OKR Akumulatif', to: 'Skor Desimal {methodTermLabel} Akumulatif' }
];

replacements.forEach(r => {
  content = content.split(r.from).join(r.to);
});

fs.writeFileSync('src/components/OkrDashboard.tsx', content, 'utf-8');
console.log('Done replacement');
