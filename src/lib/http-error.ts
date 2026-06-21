export function resolveHttpError(error: unknown): { statusCode: number; message: string } {
  if (error instanceof Error) {
    const statusCode = getStatusCode(error);
    return { statusCode, message: error.message };
  }

  return { statusCode: 500, message: "Internal Server Error" };
}

function getStatusCode(error: Error): number {
  const statusCode = Object.getOwnPropertyDescriptor(error, "statusCode")?.value;
  return typeof statusCode === "number" ? statusCode : 500;
}
