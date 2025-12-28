import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export type DevUser = {
  id: number;
  email: string;
  name: string;
  image: string;
  isAdmin: boolean;
  isPremium: boolean;
};

type DevUserCardProps = {
  user: DevUser;
  isCurrentUser: boolean;
  onSwitch: (userId: number) => void;
  isLoading: boolean;
};

export function DevUserCard({
  user,
  isCurrentUser,
  onSwitch,
  isLoading,
}: DevUserCardProps) {
  return (
    <button
      type="button"
      onClick={() => !isCurrentUser && onSwitch(user.id)}
      disabled={isCurrentUser || isLoading}
      className={`w-full text-left p-2 rounded-md border transition-colors ${
        isCurrentUser
          ? "bg-primary/10 border-primary cursor-default"
          : "hover:bg-muted border-border cursor-pointer"
      } ${isLoading ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback className="text-xs">
            {user.name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          {user.isAdmin && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Admin</Badge>
          )}
          {user.isPremium && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">Pro</Badge>
          )}
        </div>
      </div>
      {isCurrentUser && (
        <div className="text-[10px] text-primary font-medium mt-1">Current user</div>
      )}
    </button>
  );
}
