import { database } from "~/db";
import { guestBookEntries, type GuestBookEntryCreate } from "~/db/schema";

export type GuestBookEntriesWithProfile = Awaited<
  ReturnType<typeof getGuestBookEntries>
>;

export async function getGuestBookEntries() {
  return await database.query.guestBookEntries.findMany({
    with: {
      profile: true,
    },
    orderBy: (guestBookEntries, { desc }) => [desc(guestBookEntries.createdAt)],
  });
}

export async function createGuestBookEntry(data: GuestBookEntryCreate) {
  return await database.insert(guestBookEntries).values(data).returning();
}
