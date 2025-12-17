import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Search, Users, Crown, Loader2 } from "lucide-react";
import { getSegmentNotificationRecipientsListFn } from "~/fn/emails";

const recipientsListQueryOptions = queryOptions({
  queryKey: ["admin", "segments", "recipientsList"],
  queryFn: () => getSegmentNotificationRecipientsListFn(),
});

interface RecipientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipientsModal({ open, onOpenChange }: RecipientsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    ...recipientsListQueryOptions,
    enabled: open,
  });

  const filteredRecipients = useMemo(() => {
    if (!data?.recipients) return [];
    if (!searchQuery.trim()) return data.recipients;

    const query = searchQuery.toLowerCase();
    return data.recipients.filter((r) => r.email.toLowerCase().includes(query));
  }, [data?.recipients, searchQuery]);

  const premiumCount = useMemo(() => {
    return data?.recipients?.filter((r) => r.isPremium).length ?? 0;
  }, [data?.recipients]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-theme-500" />
            Eligible Recipients
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">
                {data?.recipients?.length ?? 0}
              </strong>{" "}
              total
            </span>
            <span className="flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <strong className="text-foreground">{premiumCount}</strong> premium
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results count when filtering */}
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecipients.length} of {data?.recipients?.length ?? 0}{" "}
              recipients
            </p>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRecipients.length > 0 ? (
              <ul className="divide-y divide-border">
                {filteredRecipients.map((recipient, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/30"
                  >
                    <span className="text-sm font-mono truncate">
                      {recipient.email}
                    </span>
                    {recipient.isPremium && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs ml-2 shrink-0"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                {searchQuery ? "No recipients match your search" : "No recipients found"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
