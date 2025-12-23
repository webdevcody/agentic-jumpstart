import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bug, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { DevUserCard, type DevUser } from "./dev-user-card";
import { generateRandomEmail, generateRandomName } from "./random-email-generator";
import { getDevUsersFn, devLoginFn, switchDevUserFn } from "~/fn/dev-auth";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
const STORAGE_KEY = "dev-menu-corner";
const cornerStyles: Record<Corner, string> = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

type DevFloatingMenuProps = { currentUserId: number | null };

export function DevFloatingMenu({ currentUserId }: DevFloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", isAdmin: false, isPremium: false });
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.keys(cornerStyles).includes(saved)) setCorner(saved as Corner);
  }, []);

  const saveCorner = useCallback((newCorner: Corner) => {
    setCorner(newCorner);
    localStorage.setItem(STORAGE_KEY, newCorner);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const isLeft = clientX < innerWidth / 2;
    const isTop = clientY < innerHeight / 2;
    const newCorner: Corner = isTop ? (isLeft ? "top-left" : "top-right") : (isLeft ? "bottom-left" : "bottom-right");
    saveCorner(newCorner);
  }, [saveCorner]);

  const { data: devUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["dev-users"],
    queryFn: () => getDevUsersFn(),
    enabled: isExpanded,
  });

  const switchMutation = useMutation({
    mutationFn: (userId: number) => switchDevUserFn({ data: { userId } }),
    onSuccess: () => window.location.reload(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { email: string; name: string; isAdmin: boolean; isPremium: boolean }) => devLoginFn({ data }),
    onSuccess: () => window.location.reload(),
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.name) return;
    createMutation.mutate(newUser);
  };

  const handleRandomize = () => {
    setNewUser((prev) => ({ ...prev, email: generateRandomEmail(), name: generateRandomName() }));
  };

  useEffect(() => {
    if (showCreateForm && !newUser.email) handleRandomize();
  }, [showCreateForm, newUser.email]);

  return (
    <div className={`fixed z-50 ${cornerStyles[corner]} ${isDragging ? "opacity-50" : ""}`} draggable onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
      {!isExpanded ? (
        <button type="button" onClick={() => setIsExpanded(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg shadow-lg cursor-pointer transition-colors" title="Dev Menu">
          <Bug className="h-5 w-5" />
        </button>
      ) : (
        <div className="bg-card border rounded-lg shadow-xl w-72">
          <div className="flex items-center justify-between p-3 border-b bg-yellow-500/10">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-sm">Dev Menu</span>
            </div>
            <button type="button" onClick={() => { setIsExpanded(false); setShowCreateForm(false); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">
            {!showCreateForm ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Dev Users</Label>
                  <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["dev-users"] })} className="h-6 w-6 p-0">
                    <RefreshCw className={`h-3 w-3 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="h-48 mb-3 overflow-y-auto">
                  <div className="space-y-1.5 pr-2">
                    {devUsers.map((user: DevUser) => (
                      <DevUserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} onSwitch={(id) => switchMutation.mutate(id)} isLoading={switchMutation.isPending} />
                    ))}
                    {devUsers.length === 0 && !isLoadingUsers && (
                      <div className="text-xs text-muted-foreground text-center py-4">No dev users yet</div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-3 w-3 mr-1" />Create New User
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">New User</Label>
                  <Button variant="ghost" size="sm" onClick={handleRandomize} className="h-6 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />Randomize
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="new-email" className="text-xs">Email</Label>
                    <Input id="new-email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="new-name" className="text-xs">Name</Label>
                    <Input id="new-name" value={newUser.name} onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="new-admin" checked={newUser.isAdmin} onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isAdmin: checked === true }))} />
                    <Label htmlFor="new-admin" className="text-xs cursor-pointer">Admin</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="new-premium" checked={newUser.isPremium} onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isPremium: checked === true }))} />
                    <Label htmlFor="new-premium" className="text-xs cursor-pointer">Premium</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={handleCreateUser} disabled={createMutation.isPending || !newUser.email || !newUser.name}>
                    {createMutation.isPending ? "Creating..." : "Create & Login"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="px-3 pb-2 text-[10px] text-muted-foreground text-center">Drag to reposition</div>
        </div>
      )}
    </div>
  );
}
