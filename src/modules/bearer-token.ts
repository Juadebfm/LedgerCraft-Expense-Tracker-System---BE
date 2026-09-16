import { AppError } from "../lib/app-error.js";

export function getBearerToken(
  authorizationHeader: string | undefined,
): string {
  if (!authorizationHeader) {
    throw new AppError(401, "UNAUTHENTICATED", "Request Obj Requires Header Key");
  }

  const [scheme, token, ...unexpectedParts] = authorizationHeader
    .trim()
    .split(/\s+/);

  if (scheme !== "Bearer" || !token || unexpectedParts.length > 0) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "The Authorization header must use Bearer <token>",
    );
  }

  return token;
}
