import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { AppError } from "./lib/app-error.js";

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

// the function that turns app (app.ts file) errors and validation errors into JSON shape
// that api clients recieve. All other errors are logged and become HTTP 500

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    // App level error
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }
    // Validation error
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: {
          code: `VALIDATION_ERROR`,
          message: "The request body is invalid.",
          details: error.issues,
        },
      });
    }
    // Frontend storage request files too large
    if (hasErrorCode(error, "FST_REQ_FILE_TOO_LARGE")) {
      return reply.code(413).send({
        error: {
          code: "FILE_TOO_LARGE",
          message: "The uploaded file must be 2 MB or smaller",
        },
      });
    }
    // Send more than one files
    if (
      hasErrorCode(error, "FST_FILES_LIMIT") ||
      hasErrorCode(error, "FST_PARTS_LIMITS")
    ) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Upload 1 Avatar file only",
        },
      });
    }

    app.log.error(error);
    // If it's not any other error
    return reply.code(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occured",
      },
    });
  });
}
