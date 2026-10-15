function errorAndCause(error: unknown): object[] {
  if (typeof error !== "object" || error === null) {
    return [];
  }

  return "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null
    ? [error, error.cause]
    : [error];
}

function getPgConstraintName(error: unknown) {
  for (const candidate of errorAndCause(error)) {
    if (
      "constraint_name" in candidate &&
      typeof candidate.constraint_name === "string"
    ) {
      return candidate.constraint_name;
    }

    if ("constraint" in candidate && typeof candidate.constraint === "string") {
      return candidate.constraint;
    }
  }

  return null;
}

export function isPgUniqueViolation(error: unknown) {
  return errorAndCause(error).some(
    (candidate) => "code" in candidate && candidate.code === "23505"
  );
}

export function isConstraintViolation(error: unknown, constraintName: string) {
  return (
    getPgConstraintName(error) === constraintName ||
    (error instanceof Error && error.message.includes(constraintName))
  );
}
