import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bug, Plus, RefreshCw, X, HardDrive, Cloud, Users, Settings, KeyRound } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import { DevUserCard, type DevUser } from "./dev-user-card";
import { generateRandomEmail, generateRandomName } from "./random-email-generator";
import { getDevUsersFn, devLoginFn, switchDevUserFn } from "~/fn/dev-auth";
import { getDevSettingsFn, setStorageModeFn, setAuthModeFn } from "~/fn/dev-settings";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Tab = "users" | "settings";

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
  const [activeTab, setActiveTab] = useState<Tab>("users");
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
    const newCorner: Corner = isTop ? (isLeft ? "top-left" : "top-right") : isLeft ? "bottom-left" : "bottom-right";
    saveCorner(newCorner);
  }, [saveCorner]);

  // Queries
  const { data: devUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["dev-users"],
    queryFn: () => getDevUsersFn(),
    enabled: isExpanded,
  });

  const { data: devSettings } = useQuery({
    queryKey: ["dev-settings"],
    queryFn: () => getDevSettingsFn(),
    enabled: isExpanded,
  });

  // Mutations
  const switchMutation = useMutation({
    mutationFn: (userId: number) => switchDevUserFn({ data: { userId } }),
    onSuccess: () => window.location.reload(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { email: string; name: string; isAdmin: boolean; isPremium: boolean }) => devLoginFn({ data }),
    onSuccess: () => window.location.reload(),
  });

  const storageMutation = useMutation({
    mutationFn: (mode: "r2" | "mock") => setStorageModeFn({ data: { mode } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-settings"] });
      window.location.reload();
    },
  });

  const authMutation = useMutation({
    mutationFn: (mode: "dev" | "google") => setAuthModeFn({ data: { mode } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-settings"] });
    },
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

  const handleClose = () => {
    setIsExpanded(false);
    setShowCreateForm(false);
    setActiveTab("users");
  };

  return (
    <div
      className={`fixed z-50 ${cornerStyles[corner]} ${isDragging ? "opacity-50" : ""}`}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg shadow-lg cursor-pointer transition-colors"
          title="Dev Menu"
        >
          <Bug className="h-5 w-5" />
        </button>
      ) : (
        <div className="bg-card border rounded-lg shadow-xl w-80">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-yellow-500/10">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-sm">Dev Menu</span>
            </div>
            <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => { setActiveTab("users"); setShowCreateForm(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                activeTab === "users"
                  ? "text-foreground border-b-2 border-yellow-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Users
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("settings"); setShowCreateForm(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                activeTab === "settings"
                  ? "text-foreground border-b-2 border-yellow-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {activeTab === "users" && !showCreateForm && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Dev Users</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["dev-users"] })}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="h-52 mb-3 overflow-y-auto">
                  <div className="space-y-1.5 pr-2">
                    {devUsers.map((user: DevUser) => (
                      <DevUserCard
                        key={user.id}
                        user={user}
                        isCurrentUser={user.id === currentUserId}
                        onSwitch={(id) => switchMutation.mutate(id)}
                        isLoading={switchMutation.isPending}
                      />
                    ))}
                    {devUsers.length === 0 && !isLoadingUsers && (
                      <div className="text-xs text-muted-foreground text-center py-4">No dev users yet</div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create New User
                </Button>
              </>
            )}

            {activeTab === "users" && showCreateForm && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">New User</Label>
                  <Button variant="ghost" size="sm" onClick={handleRandomize} className="h-6 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Randomize
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="new-email" className="text-xs">Email</Label>
                    <Input
                      id="new-email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-name" className="text-xs">Name</Label>
                    <Input
                      id="new-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="new-admin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isAdmin: checked === true }))}
                    />
                    <Label htmlFor="new-admin" className="text-xs cursor-pointer">Admin</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="new-premium"
                      checked={newUser.isPremium}
                      onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isPremium: checked === true }))}
                    />
                    <Label htmlFor="new-premium" className="text-xs cursor-pointer">Premium</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateUser}
                    disabled={createMutation.isPending || !newUser.email || !newUser.name}
                  >
                    {createMutation.isPending ? "Creating..." : "Create & Login"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Storage Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs font-medium">Storage</Label>
                  </div>
                  {devSettings?.storage.available ? (
                    <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                      <span className="text-xs text-muted-foreground">Mock</span>
                      <Switch
                        checked={devSettings.storage.mode === "r2"}
                        onCheckedChange={(checked) => storageMutation.mutate(checked ? "r2" : "mock")}
                        disabled={storageMutation.isPending}
                      />
                      <div className="flex items-center gap-1">
                        <Cloud className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-muted-foreground">R2</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      Using Mock (R2 credentials not configured)
                    </div>
                  )}
                </div>

                {/* Auth Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs font-medium">Authentication</Label>
                  </div>
                  {devSettings?.auth.available ? (
                    <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                      <span className="text-xs text-muted-foreground">Dev Login</span>
                      <Switch
                        checked={devSettings.auth.mode === "google"}
                        onCheckedChange={(checked) => authMutation.mutate(checked ? "google" : "dev")}
                        disabled={authMutation.isPending}
                      />
                      <span className="text-xs text-muted-foreground">Google</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      Using Dev Login (Google OAuth not configured)
                    </div>
                  )}
                </div>

                {/* Current Status */}
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">Current Status</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Storage:</span>{" "}
                      <span className="font-medium">{devSettings?.storage.mode === "r2" ? "R2" : "Mock"}</span>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Auth:</span>{" "}
                      <span className="font-medium">{devSettings?.auth.mode === "google" ? "Google" : "Dev"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 pb-2 text-[10px] text-muted-foreground text-center">Drag to reposition</div>
        </div>
      )}
    </div>
  );
}
