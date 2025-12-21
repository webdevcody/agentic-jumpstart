type ProfileWithNames = {
  displayName: string | null;
  realName: string | null;
  useDisplayName: boolean;
};

export function getPublicName(profile: ProfileWithNames): string {
  if (profile.useDisplayName || !profile.realName) {
    return profile.displayName || "Anonymous";
  }
  return profile.realName;
}

export function toPublicProfile<T extends ProfileWithNames>(
  profile: T
): Omit<T, "realName" | "useDisplayName"> & { publicName: string } {
  const { realName, useDisplayName, ...safeProfile } = profile;
  return {
    ...safeProfile,
    publicName: getPublicName(profile),
  };
}

export function addPublicNameForAdmin<T extends ProfileWithNames>(
  profile: T
): T & { publicName: string } {
  return {
    ...profile,
    publicName: getPublicName(profile),
  };
}
