const fs = require('fs');
const content = fs.readFileSync('src/mockData.ts', 'utf8');

const newKRs = `
  {
    id: "kr_corp_1_1",
    objectiveId: "obj_corp_1",
    title: "Meningkatkan pangsa pasar menjadi 35%",
    targetValue: 35,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 20,
    progress: 57,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_1_2",
    objectiveId: "obj_corp_1",
    title: "Mempertahankan margin EBITDA di 20%",
    targetValue: 20,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 18,
    progress: 90,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_2_1",
    objectiveId: "obj_corp_2",
    title: "Menurunkan turnover rate menjadi < 5%",
    targetValue: 5,
    unit: "%",
    calcSystem: "minimize",
    weight: 50,
    currentValue: 8,
    progress: 40,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_2_2",
    objectiveId: "obj_corp_2",
    title: "Meningkatkan OEE (Overall Equipment Effectiveness) ke 85%",
    targetValue: 85,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 70,
    progress: 82,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
`;

const updatedContent = content.replace("export const initialKeyResults: KeyResult[] = [", "export const initialKeyResults: KeyResult[] = [" + newKRs);
fs.writeFileSync('src/mockData.ts', updatedContent);
