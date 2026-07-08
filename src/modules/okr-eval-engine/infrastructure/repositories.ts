import { IObjectiveRepository, IKeyResultRepository } from "../interfaces/repositories";
import { ObjectiveEntity, KeyResultEntity } from "../domain/entities";
import { calculateKRStatus, calculateObjectiveScore, calculateObjectiveStatus } from "../domain/rules";

export class InMemoryObjectiveRepository implements IObjectiveRepository {
  private objectives: Map<string, ObjectiveEntity> = new Map();

  constructor(initialData?: ObjectiveEntity[]) {
    if (initialData) {
      initialData.forEach(obj => this.objectives.set(obj.id, obj));
    } else {
      // Seed default Clean Architecture OKR Evaluation data
      const defaultObjs: ObjectiveEntity[] = [
        {
          id: "demo_obj_1",
          title: "Meningkatkan Kecepatan Dan Keamanan Sistem Cloud Core",
          quarterId: "Q1 2026",
          employeeId: "emp_1",
          keyResults: [],
          score: 0.67,
          status: "Performance",
          highPerformanceCount: 2,
          totalKRsCount: 3
        },
        {
          id: "demo_obj_2",
          title: "Transformasi Pengalaman Pengguna (UI/UX) Berbasis Data",
          quarterId: "Q1 2026",
          employeeId: "emp_2",
          keyResults: [],
          score: 1.00,
          status: "High Performance",
          highPerformanceCount: 2,
          totalKRsCount: 2
        }
      ];
      defaultObjs.forEach(obj => this.objectives.set(obj.id, obj));
    }
  }

  public async getById(id: string): Promise<ObjectiveEntity | null> {
    const obj = this.objectives.get(id);
    return obj ? { ...obj } : null;
  }

  public async getAll(quarterId?: string): Promise<ObjectiveEntity[]> {
    const list = Array.from(this.objectives.values()).map(o => ({ ...o }));
    if (quarterId) {
      return list.filter(o => o.quarterId === quarterId);
    }
    return list;
  }

  public async save(objective: ObjectiveEntity): Promise<ObjectiveEntity> {
    this.objectives.set(objective.id, { ...objective });
    return { ...objective };
  }

  public async delete(id: string): Promise<boolean> {
    return this.objectives.delete(id);
  }
}

export class InMemoryKeyResultRepository implements IKeyResultRepository {
  private keyResults: Map<string, KeyResultEntity> = new Map();

  constructor(initialData?: KeyResultEntity[]) {
    if (initialData) {
      initialData.forEach(kr => this.keyResults.set(kr.id, kr));
    } else {
      // Seed default Clean Architecture OKR KRs mapping
      const defaultKRs: KeyResultEntity[] = [
        // demo_obj_1
        {
          id: "demo_kr_1",
          objectiveId: "demo_obj_1",
          title: "Optimasi API Core latency menjadi di bawah 100ms (Max Target)",
          okrType: "committed",
          score: 1.00,
          status: "High Performance"
        },
        {
          id: "demo_kr_2",
          objectiveId: "demo_obj_1",
          title: "Uptime SLA infrastruktur mencapai 99.99%",
          okrType: "committed",
          score: 0.83,
          status: "Performance"
        },
        {
          id: "demo_kr_3",
          objectiveId: "demo_obj_1",
          title: "Penetration Testing score minimal A dari auditor eksternal",
          okrType: "aspirational",
          score: 0.74,
          status: "High Performance"
        },
        // demo_obj_2
        {
          id: "demo_kr_4",
          objectiveId: "demo_obj_2",
          title: "Peningkatan Net Promoter Score (NPS) pelanggan dari 40 ke 60",
          okrType: "aspirational",
          score: 0.85,
          status: "High Performance"
        },
        {
          id: "demo_kr_5",
          objectiveId: "demo_obj_2",
          title: "Reduksi loading time halaman checkout di bawah 1.5 detik",
          okrType: "committed",
          score: 1.00,
          status: "High Performance"
        }
      ];
      defaultKRs.forEach(kr => this.keyResults.set(kr.id, kr));
    }
  }

  public async getById(id: string): Promise<KeyResultEntity | null> {
    const kr = this.keyResults.get(id);
    return kr ? { ...kr } : null;
  }

  public async getByObjectiveId(objectiveId: string): Promise<KeyResultEntity[]> {
    const list = Array.from(this.keyResults.values()).map(k => ({ ...k }));
    return list.filter(k => k.objectiveId === objectiveId);
  }

  public async save(keyResult: KeyResultEntity): Promise<KeyResultEntity> {
    this.keyResults.set(keyResult.id, { ...keyResult });
    return { ...keyResult };
  }

  public async delete(id: string): Promise<boolean> {
    return this.keyResults.delete(id);
  }
}
