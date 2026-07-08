import { OkrType } from "../domain/entities";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates Key Result input data.
 * Throws ValidationError if rules are violated.
 */
export function validateKeyResultInput(score: any, okrType: any): void {
  // Validate OKR Type
  if (okrType !== "committed" && okrType !== "aspirational") {
    throw new ValidationError("Tipe OKR harus bernilai 'committed' atau 'aspirational'.");
  }

  // Check empty or undefined
  if (score === undefined || score === null || score === "") {
    throw new ValidationError("Nilai harus berada pada rentang 0.00 sampai 1.00.");
  }

  // Parse score
  const parsedScore = Number(score);

  // Validate number range
  if (isNaN(parsedScore) || parsedScore < 0.00 || parsedScore > 1.00) {
    throw new ValidationError("Nilai harus berada pada rentang 0.00 sampai 1.00.");
  }
}

/**
 * Validates Objective input data.
 */
export function validateObjectiveInput(title: string, quarterId: string): void {
  if (!title || title.trim() === "") {
    throw new ValidationError("Judul Objective tidak boleh kosong.");
  }
  if (!quarterId || quarterId.trim() === "") {
    throw new ValidationError("Kuartal Target tidak boleh kosong.");
  }
}
