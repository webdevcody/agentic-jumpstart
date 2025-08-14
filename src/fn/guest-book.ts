import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "~/lib/auth";
import {
  createGuestBookEntryUseCase,
  getGuestBookEntriesUseCase,
} from "~/use-cases/guest-book";

export const guestBookSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be at most 500 characters"),
});

export const getGuestBookEntriesFn = createServerFn().handler(async () => {
  const entries = await getGuestBookEntriesUseCase();
  return { entries };
});

export const createGuestBookEntryFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(guestBookSchema)
  .handler(async ({ data, context }) => {
    await createGuestBookEntryUseCase({
      userId: context.userId,
      message: data.message,
    });
  });
