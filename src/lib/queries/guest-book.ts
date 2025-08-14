import { queryOptions } from "@tanstack/react-query";
import { getGuestBookEntriesFn } from "~/fn/guest-book";

export const getGuestBookEntriesQuery = () =>
  queryOptions({
    queryKey: ["guest-book"] as const,
    queryFn: () => getGuestBookEntriesFn(),
  });
