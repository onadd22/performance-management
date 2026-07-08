import { describe, it, expect } from "vitest";
import { calculateKRStatus, calculateObjectiveScore, calculateObjectiveStatus } from "../src/modules/okr-eval-engine/domain/rules";
import { validateKeyResultInput, ValidationError } from "../src/modules/okr-eval-engine/application/validation";
import { InMemoryObjectiveRepository, InMemoryKeyResultRepository } from "../src/modules/okr-eval-engine/infrastructure/repositories";
import { OkrEvaluationService } from "../src/modules/okr-eval-engine/application/services";

describe("OKR Performance Evaluation Engine - Clean Architecture", () => {
  
  describe("1) Key Result Status Calculations (Based on Type & Score)", () => {
    
    describe("Commitment OKRs", () => {
      it("should be High Performance if score is exactly 1.00", () => {
        expect(calculateKRStatus(1.00, "committed")).toBe("High Performance");
      });

      it("should be Performance if score is between 0.80 and 0.99", () => {
        expect(calculateKRStatus(0.99, "committed")).toBe("Performance");
        expect(calculateKRStatus(0.85, "committed")).toBe("Performance");
        expect(calculateKRStatus(0.80, "committed")).toBe("Performance");
      });

      it("should be Under Performance if score is less than 0.80", () => {
        expect(calculateKRStatus(0.79, "committed")).toBe("Under Performance");
        expect(calculateKRStatus(0.45, "committed")).toBe("Under Performance");
        expect(calculateKRStatus(0.00, "committed")).toBe("Under Performance");
      });
    });

    describe("Aspirational OKRs", () => {
      it("should be High Performance if score is between 0.70 and 1.00", () => {
        expect(calculateKRStatus(1.00, "aspirational")).toBe("High Performance");
        expect(calculateKRStatus(0.85, "aspirational")).toBe("High Performance");
        expect(calculateKRStatus(0.70, "aspirational")).toBe("High Performance");
      });

      it("should be Target if score is between 0.40 and 0.69", () => {
        expect(calculateKRStatus(0.69, "aspirational")).toBe("Target");
        expect(calculateKRStatus(0.55, "aspirational")).toBe("Target");
        expect(calculateKRStatus(0.40, "aspirational")).toBe("Target");
      });

      it("should be Under Performance if score is less than 0.40", () => {
        expect(calculateKRStatus(0.39, "aspirational")).toBe("Under Performance");
        expect(calculateKRStatus(0.15, "aspirational")).toBe("Under Performance");
        expect(calculateKRStatus(0.00, "aspirational")).toBe("Under Performance");
      });
    });
  });

  describe("2) Objective Score and Status Calculations", () => {
    
    it("should calculate correctly for User Prompt Contoh 1 (3 High)", () => {
      const krs = [
        { score: 1.00, okrType: "committed" as const }, // High Performance
        { score: 1.00, okrType: "committed" as const }, // High Performance
        { score: 0.70, okrType: "aspirational" as const } // High Performance
      ];
      const score = calculateObjectiveScore(krs);
      expect(score).toBe(1.00);
      expect(calculateObjectiveStatus(score)).toBe("High Performance");
    });

    it("should calculate correctly for User Prompt Contoh 2 (2 High, 1 Performance)", () => {
      const krs = [
        { score: 1.00, okrType: "committed" as const }, // High
        { score: 0.80, okrType: "committed" as const }, // Performance
        { score: 0.75, okrType: "aspirational" as const } // High
      ];
      const score = calculateObjectiveScore(krs);
      expect(score).toBe(0.67); // 2/3 = 0.67
      expect(calculateObjectiveStatus(score)).toBe("Performance");
    });

    it("should calculate correctly for User Prompt Contoh 3 (0 High)", () => {
      const krs = [
        { score: 0.75, okrType: "committed" as const }, // Under Performance
        { score: 0.95, okrType: "committed" as const }, // Performance
        { score: 0.60, okrType: "aspirational" as const } // Target
      ];
      const score = calculateObjectiveScore(krs);
      expect(score).toBe(0.00); // 0/3 = 0.00
      expect(calculateObjectiveStatus(score)).toBe("Under Performance");
    });

    it("should calculate correctly for User Prompt Contoh 4 (8 KRs: 5 High, 3 Non-High)", () => {
      // 5 High, 3 Non-High: 5/8 = 0.625 -> rounded to 0.63
      const krs = [
        { score: 1.00, okrType: "committed" as const }, // High
        { score: 1.00, okrType: "committed" as const }, // High
        { score: 1.00, okrType: "committed" as const }, // High
        { score: 0.85, okrType: "committed" as const }, // Performance (Non-High)
        { score: 0.70, okrType: "aspirational" as const }, // High
        { score: 0.50, okrType: "aspirational" as const }, // Target (Non-High)
        { score: 0.80, okrType: "aspirational" as const }, // High
        { score: 0.10, okrType: "aspirational" as const } // Under (Non-High)
      ];
      const score = calculateObjectiveScore(krs);
      expect(score).toBe(0.63);
      expect(calculateObjectiveStatus(score)).toBe("Performance");
    });

    it("should calculate correctly for User Prompt Contoh 5 (10 KRs: all High)", () => {
      const krs = Array(10).fill({ score: 1.00, okrType: "committed" as const });
      const score = calculateObjectiveScore(krs);
      expect(score).toBe(1.00);
      expect(calculateObjectiveStatus(score)).toBe("High Performance");
    });
  });

  describe("3) Validation Rules", () => {
    
    it("should allow correct scores", () => {
      expect(() => validateKeyResultInput(0.00, "committed")).not.toThrow();
      expect(() => validateKeyResultInput(0.57, "aspirational")).not.toThrow();
      expect(() => validateKeyResultInput(1.00, "committed")).not.toThrow();
    });

    it("should throw error for out of range values (e.g. 1.5, -1, 100)", () => {
      expect(() => validateKeyResultInput(-1, "committed")).toThrow(ValidationError);
      expect(() => validateKeyResultInput(1.5, "committed")).toThrow(ValidationError);
      expect(() => validateKeyResultInput(100, "committed")).toThrow(ValidationError);
    });

    it("should throw error for invalid types or empty/null scores", () => {
      expect(() => validateKeyResultInput(null, "committed")).toThrow(ValidationError);
      expect(() => validateKeyResultInput("", "committed")).toThrow(ValidationError);
      expect(() => validateKeyResultInput("abc", "committed")).toThrow(ValidationError);
    });
  });

  describe("4) Service Coordination and Trigger Recalculations", () => {
    
    it("should recalculate objective automatically when key result score changes", async () => {
      const objRepo = new InMemoryObjectiveRepository();
      const krRepo = new InMemoryKeyResultRepository();
      const service = new OkrEvaluationService(objRepo, krRepo);

      // Create objective
      const obj = await service.createObjective("Evaluasi Kinerja Q1", "Q1 2026");
      
      // Add key results
      const kr1 = await service.createKeyResult(obj.id, "KR 1", "committed", 1.00); // High Performance
      const kr2 = await service.createKeyResult(obj.id, "KR 2", "aspirational", 0.50); // Target
      
      // Current high performance = 1, total = 2. Objective score = 1/2 = 0.50 (Performance)
      let updatedObj = await objRepo.getById(obj.id);
      expect(updatedObj?.score).toBe(0.50);
      expect(updatedObj?.status).toBe("Performance");

      // Update kr2 to High Performance (0.50 -> 0.75)
      await service.updateKeyResult(kr2.id, { score: 0.75 });

      // High performance = 2, total = 2. Objective score = 2/2 = 1.00 (High Performance)
      updatedObj = await objRepo.getById(obj.id);
      expect(updatedObj?.score).toBe(1.00);
      expect(updatedObj?.status).toBe("High Performance");
    });
  });
});
