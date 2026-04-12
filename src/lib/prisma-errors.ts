type PrismaLikeError = {
  code?: string;
  name?: string;
  message?: string;
  cause?: unknown;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const prismaError = error as PrismaLikeError;
  const message = getErrorMessage(error);
  const causeMessage = getErrorMessage(prismaError.cause);

  return (
    prismaError.code === "P1001" ||
    prismaError.name === "DriverAdapterError" ||
    message.includes("Can't reach database server") ||
    message.includes("DatabaseNotReachable") ||
    causeMessage.includes("Can't reach database server") ||
    causeMessage.includes("DatabaseNotReachable")
  );
}
