import { ObjectiveEntity, KeyResultEntity } from "../domain/entities";

export interface IObjectiveRepository {
  getById(id: string): Promise<ObjectiveEntity | null>;
  getAll(quarterId?: string): Promise<ObjectiveEntity[]>;
  save(objective: ObjectiveEntity): Promise<ObjectiveEntity>;
  delete(id: string): Promise<boolean>;
}

export interface IKeyResultRepository {
  getById(id: string): Promise<KeyResultEntity | null>;
  getByObjectiveId(objectiveId: string): Promise<KeyResultEntity[]>;
  save(keyResult: KeyResultEntity): Promise<KeyResultEntity>;
  delete(id: string): Promise<boolean>;
}
