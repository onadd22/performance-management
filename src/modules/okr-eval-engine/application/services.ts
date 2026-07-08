import { ObjectiveEntity, KeyResultEntity, OkrType } from "../domain/entities";
import { calculateKRStatus, calculateObjectiveScore, calculateObjectiveStatus } from "../domain/rules";
import { validateKeyResultInput, validateObjectiveInput } from "./validation";
import { IObjectiveRepository, IKeyResultRepository } from "../interfaces/repositories";

export class OkrEvaluationService {
  private objectiveRepo: IObjectiveRepository;
  private keyResultRepo: IKeyResultRepository;

  constructor(objectiveRepo: IObjectiveRepository, keyResultRepo: IKeyResultRepository) {
    this.objectiveRepo = objectiveRepo;
    this.keyResultRepo = keyResultRepo;
  }

  /**
   * Evaluates and updates a Key Result's status based on score and type.
   */
  public evaluateKRStatus(score: number, type: OkrType) {
    validateKeyResultInput(score, type);
    return calculateKRStatus(score, type);
  }

  /**
   * Fully recalculates an Objective's score and status from its Key Results.
   * Objective Score = Count of High Performance KRs / Total KRs
   */
  public async recalculateObjective(objectiveId: string): Promise<ObjectiveEntity | null> {
    const objective = await this.objectiveRepo.getById(objectiveId);
    if (!objective) return null;

    const keyResults = await this.keyResultRepo.getByObjectiveId(objectiveId);
    
    // Evaluate status for each key result
    const evaluatedKRs: KeyResultEntity[] = keyResults.map(kr => ({
      ...kr,
      status: calculateKRStatus(kr.score, kr.okrType)
    }));

    // Calculate score
    const score = calculateObjectiveScore(evaluatedKRs);
    const status = calculateObjectiveStatus(score);

    const highPerformanceCount = evaluatedKRs.filter(kr => kr.status === "High Performance").length;

    const updatedObjective: ObjectiveEntity = {
      ...objective,
      keyResults: evaluatedKRs,
      score,
      status,
      highPerformanceCount,
      totalKRsCount: evaluatedKRs.length
    };

    return await this.objectiveRepo.save(updatedObjective);
  }

  /**
   * Creates a new Objective.
   */
  public async createObjective(title: string, quarterId: string, employeeId?: string): Promise<ObjectiveEntity> {
    validateObjectiveInput(title, quarterId);

    const newObj: ObjectiveEntity = {
      id: `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      quarterId,
      employeeId,
      keyResults: [],
      score: 0.00,
      status: "Under Performance",
      highPerformanceCount: 0,
      totalKRsCount: 0
    };

    return await this.objectiveRepo.save(newObj);
  }

  /**
   * Creates a new Key Result inside an Objective and triggers automatic recalculation of the Objective.
   */
  public async createKeyResult(
    objectiveId: string,
    title: string,
    okrType: OkrType,
    score: number
  ): Promise<KeyResultEntity> {
    validateKeyResultInput(score, okrType);

    const status = calculateKRStatus(score, okrType);
    const newKR: KeyResultEntity = {
      id: `kr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      objectiveId,
      title: title.trim(),
      okrType,
      score: Number(score.toFixed(2)),
      status
    };

    // Save key result
    await this.keyResultRepo.save(newKR);

    // Trigger automatic real-time recalculation of the parent Objective
    await this.recalculateObjective(objectiveId);

    return newKR;
  }

  /**
   * Updates an existing Key Result's score, type, or title and triggers automatic real-time recalculation.
   */
  public async updateKeyResult(
    id: string,
    updates: { title?: string; okrType?: OkrType; score?: number }
  ): Promise<KeyResultEntity> {
    const kr = await this.keyResultRepo.getById(id);
    if (!kr) {
      throw new Error("Key Result tidak ditemukan.");
    }

    const title = updates.title !== undefined ? updates.title.trim() : kr.title;
    const okrType = updates.okrType !== undefined ? updates.okrType : kr.okrType;
    const score = updates.score !== undefined ? updates.score : kr.score;

    // Validate inputs
    validateKeyResultInput(score, okrType);

    const status = calculateKRStatus(score, okrType);
    const updatedKR: KeyResultEntity = {
      ...kr,
      title,
      okrType,
      score: Number(score.toFixed(2)),
      status
    };

    await this.keyResultRepo.save(updatedKR);

    // Trigger automatic real-time recalculation of the parent Objective
    await this.recalculateObjective(kr.objectiveId);

    return updatedKR;
  }

  /**
   * Deletes a Key Result and triggers automatic recalculation of the parent Objective.
   */
  public async deleteKeyResult(id: string): Promise<boolean> {
    const kr = await this.keyResultRepo.getById(id);
    if (!kr) return false;

    const success = await this.keyResultRepo.delete(id);
    if (success) {
      // Trigger automatic real-time recalculation of the parent Objective
      await this.recalculateObjective(kr.objectiveId);
    }
    return success;
  }

  /**
   * Deletes an Objective and all its associated Key Results.
   */
  public async deleteObjective(id: string): Promise<boolean> {
    const krs = await this.keyResultRepo.getByObjectiveId(id);
    for (const kr of krs) {
      await this.keyResultRepo.delete(kr.id);
    }
    return await this.objectiveRepo.delete(id);
  }
}
