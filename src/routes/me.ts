import type { FastifyPluginAsync } from "fastify";

import { z } from "zod";

import { getBearerToken } from "../modules/auth/bearer-token.js";
import { AppError } from "../lib/app-error.js";
import type {
  AuthGateway,
  AvatarUpload,
  ProfileUpdateInput,
} from "../modules/auth/types.js";
import { request } from "http";

const avatarFileSizeLimit = 2 * 1024 * 1024;
const avatarContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;

// Helper functions

function hasPngSignature(content: Buffer): boolean {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  if (content.length < pngSignature.length) {
    return false;
  }

  return content.subarray(0, pngSignature.length).equals(pngSignature);
}

function hasJpegSignature(content: Buffer): boolean {
  const jpegSignature = Buffer.from([255, 216, 255]);

  if (content.length < jpegSignature.length) {
    return false;
  }

  return content.subarray(0, jpegSignature.length).equals(jpegSignature);
}

function hasWebpSignature(content: Buffer): boolean {
  const riffSignature = Buffer.from("RIFF");
  const webpSignature = Buffer.from("WEBP");

  if (content.length < 12) {
    return false;
  }

  const startsWithRiff = content
    .subarray(0, riffSignature.length)
    .equals(riffSignature);

  const hasWebpFormat = content
    .subarray(8, 8 + webpSignature.length)
    .equals(webpSignature);

  return startsWithRiff && hasWebpFormat;
}

function isContentTypeAndSignatureValid(
  contentType: string,
  content: Buffer,
): boolean {
  if (contentType === "image/png") return hasPngSignature(content);
  if (contentType === "image/jpeg") return hasJpegSignature(content);
  if (contentType === "image/webp") return hasWebpSignature(content);
  return false;
}

// Validation
const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    timezone: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine(
    (input) => input.fullName !== undefined || input.timezone !== undefined,
    {
      message: "Please provide at least one profile field to update",
    },
  );

export function createMeRoutes(authGateway: AuthGateway): FastifyPluginAsync {
  return async (app) => {
    // This calls the current user in session
    app.get("/v1/me", async (request) => {
      const accessToken = getBearerToken(request.headers.authorization);
      return authGateway.getCurrentUser(accessToken);
    });

    // Update
    app.patch("/v1/me", async (request) => {
      const accessToken = getBearerToken(request.headers.authorization);
      const input = updateProfileSchema.parse(request.body);
      //   Actual update
      const update: ProfileUpdateInput = {};
      if (input.fullName !== undefined) update.fullName = input.fullName;
      if (input.timezone !== undefined) update.timezone = input.timezone;

      const profile = await authGateway.updateProfile(accessToken, update);
      return { profile };
    });

    // Upload/change avatar
    app.put("/v1/me/avatar", async (request) => {
      const accessToken = getBearerToken(request.headers.authorization);
      // Comback to check if file is still underlined
      const file = await request.file({
        limits: {
          files: 1,
          fields: 0,
          parts: 1,
          fileSize: avatarFileSizeLimit,
        },
      });
      if (!file || file.fieldname !== "avatar") {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Provide one file in the avatar field",
        );
      }
      const content = await file.toBuffer();
      const isAllowedContentType = avatarContentTypes.includes(
        file.mimetype as (typeof avatarContentTypes)[number],
      );

      if (
        !isAllowedContentType ||
        !isContentTypeAndSignatureValid(file.mimetype, content)
      ) {
        throw new AppError(
          400,
          "INVALID_AVATAR_FILE",
          "The avatar must be a valid JPEG, PNG, or WEBP image",
        );
      }

      const avatar: AvatarUpload = {
        content,
        contentType: file.mimetype as AvatarUpload["contentType"],
      };
      const profile = await authGateway.uploadAvatar(accessToken, avatar);
      return { profile };
    });

    // delete user (soft delete)
    app.delete("/v1/me", async (request, reply) => {
      const accessToken = getBearerToken(request.headers.authorization);
      await authGateway.softDeleteCurrentUser(accessToken);
      return reply.code(204).send();
    });
  };
}
