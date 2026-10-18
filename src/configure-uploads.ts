import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

// First line of defence for every multipart requests
// this secures the files both at the start point to the endpoint

export function registerUploadHandling(app: FastifyInstance): void {
  app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 2 * 1024 * 1024,
    },
  });
}
