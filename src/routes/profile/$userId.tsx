import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Page } from "~/routes/admin/-components/page";
import { PageHeader } from "~/routes/admin/-components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  ExternalLink,
  Github,
  Globe,
  Twitter,
  User,
  Pencil,
  Lock,
} from "lucide-react";
import { getPublicProfileFn } from "~/fn/profiles";
import { getUserInfoFn } from "~/fn/users";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfilePage,
  loader: async ({ params }) => {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    const { user: currentUser } = await getUserInfoFn();
    const currentUserId = currentUser?.id;

    // Fetch the profile to check if it's public
    const profile = await getPublicProfileFn({ data: { userId } });

    if (!profile) {
      return { userId, currentUserId, profile: null, hasAccess: false };
    }

    // Check access: profile is public OR user is viewing their own profile
    const hasAccess = profile.isPublicProfile || currentUserId === userId;

    // If no access, return early with access denied flag
    if (!hasAccess) {
      return { userId, currentUserId, profile: null, hasAccess: false };
    }

    return { userId, currentUserId, profile, hasAccess: true };
  },
});

function ProfilePage() {
  const {
    userId,
    currentUserId,
    profile: loaderProfile,
    hasAccess,
  } = Route.useLoaderData();
  const isOwnProfile = currentUserId === userId;

  // Use loader data for initial render, query for updates
  // staleTime: 0 ensures we always fetch fresh data (fixes useDisplayName toggle)
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile", "public", userId],
    queryFn: () => getPublicProfileFn({ data: { userId } }),
    staleTime: 0,
  });

  // Use query data if available, otherwise fall back to loader data
  const profileData = profile || loaderProfile;

  // Check if profile exists
  if (!profileData) {
    return (
      <Page>
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-900 dark:to-theme-800 shadow-elevation-2">
                <User className="h-8 w-8 text-theme-600 dark:text-theme-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">
                Profile Not Found
              </h3>
              <p className="text-muted-foreground">
                This user profile does not exist or is not available.
              </p>
            </div>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  // Check access: profile is public OR user is viewing their own profile
  // This check happens both in loader and component for security
  const canAccess = profileData.isPublicProfile || isOwnProfile;

  // Early return if user doesn't have access
  if (!canAccess) {
    return (
      <Page>
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-900 dark:to-theme-800 shadow-elevation-2">
                <Lock className="h-8 w-8 text-theme-600 dark:text-theme-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">
                Profile is Private
              </h3>
              <p className="text-muted-foreground">
                This profile is set to private and is only visible to the
                profile owner.
              </p>
            </div>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  const publicName = profileData.publicName || profileData.displayName || "User";
  const initials = publicName
    .trim()
    .split(/\s+/)
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <Page>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between">
          <PageHeader
            title={publicName}
            highlightedWord={publicName.split(" ")[0] || "User"}
            description={
              <span>
                Explore {publicName}'s work and projects
              </span>
            }
          />
          {isOwnProfile && (
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-8">
          {/* Profile Info Section */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="w-32 h-32 shadow-elevation-2">
                    <AvatarImage
                      src={profile.image || undefined}
                      alt={publicName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-theme-500 text-white text-4xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {publicName}
                    </h1>
                    {profileData.bio && (
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {profileData.bio}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  {(profileData.twitterHandle ||
                    profileData.githubHandle ||
                    profileData.websiteUrl) && (
                    <div className="flex flex-wrap gap-3">
                      {profileData.twitterHandle && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://twitter.com/${profileData.twitterHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Twitter className="h-4 w-4" />@
                            {profileData.twitterHandle}
                          </a>
                        </Button>
                      )}
                      {profileData.githubHandle && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://github.com/${profileData.githubHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Github className="h-4 w-4" />
                            {profileData.githubHandle}
                          </a>
                        </Button>
                      )}
                      {profileData.websiteUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={profileData.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          {profileData.projects && profileData.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Projects & Showcases
                  <Badge variant="secondary">
                    {profileData.projects.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Explore the projects and work by {publicName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profileData.projects.map((project) => (
                    <Card
                      key={project.id}
                      className="hover:shadow-elevation-2 transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        {project.imageUrl && (
                          <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {project.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {project.description}
                            </p>
                          </div>

                          {project.technologies && (
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(project.technologies).map(
                                (tech: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tech}
                                  </Badge>
                                )
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {project.projectUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={project.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Live Demo
                                </a>
                              </Button>
                            )}
                            {project.repositoryUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={project.repositoryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Github className="h-3 w-3 mr-1" />
                                  Code
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty Projects State */}
          {(!profileData.projects || profileData.projects.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-900 dark:to-theme-800 shadow-elevation-2 inline-block">
                    <User className="h-8 w-8 text-theme-600 dark:text-theme-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      No Projects Yet
                    </h3>
                    <p className="text-muted-foreground">
                      {publicName} hasn't added any projects to showcase yet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
