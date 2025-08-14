import {
  createGuestBookEntry,
  getGuestBookEntries,
} from "~/data-access/guest-book";
import { type GuestBookEntryCreate } from "~/db/schema";

export async function createGuestBookEntryUseCase(data: GuestBookEntryCreate) {
  return await createGuestBookEntry(data);
}

export async function getGuestBookEntriesUseCase() {
  return await getGuestBookEntries();
}
