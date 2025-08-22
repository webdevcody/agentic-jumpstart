import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Page } from "~/routes/admin/-components/page";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ExternalLink, Github, Globe, Twitter, User } from "lucide-react";
import { getPublicProfileFn } from "~/fn/profiles";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfilePage,
  loader: async ({ params }) => {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    return { userId };
  },
});

function ProfilePage() {
  const { userId } = Route.useLoaderData();
  
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile", "public", userId],
    queryFn: () => getPublicProfileFn({ data: { userId } }),
  });

  if (!profile) {
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

  const initials = profile.displayName 
    ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'U';

  return (
    <Page>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={profile.displayName || "User Profile"}
          highlightedWord={profile.displayName?.split(' ')[0] || "User"}
          description={
            <span>
              Explore {profile.displayName || "this user"}'s work and projects
            </span>
          }
        />

        <div className="space-y-8">
          {/* Profile Info Section */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-800 dark:to-theme-700 shadow-elevation-2">
                    <img 
                      src={profile.image || `https://api.dicebear.com/9.x/initials/svg?seed=${profile.displayName}&backgroundColor=6366f1&textColor=ffffff`}
                      alt={profile.displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.displayName || "User"}</h1>
                    {profile.bio && (
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  {(profile.twitterHandle || profile.githubHandle || profile.websiteUrl) && (
                    <div className="flex flex-wrap gap-3">
                      {profile.twitterHandle && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://twitter.com/${profile.twitterHandle}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Twitter className="h-4 w-4" />
                            @{profile.twitterHandle}
                          </a>
                        </Button>
                      )}
                      {profile.githubHandle && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://github.com/${profile.githubHandle}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Github className="h-4 w-4" />
                            {profile.githubHandle}
                          </a>
                        </Button>
                      )}
                      {profile.websiteUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={profile.websiteUrl} 
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
          {profile.projects && profile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Projects & Showcases
                  <Badge variant="secondary">{profile.projects.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Explore the projects and work by {profile.displayName || "this user"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-elevation-2 transition-all duration-200">
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
                            <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {project.description}
                            </p>
                          </div>
                          
                          {project.technologies && (
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(project.technologies).map((tech: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
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
          {(!profile.projects || profile.projects.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-900 dark:to-theme-800 shadow-elevation-2 inline-block">
                    <User className="h-8 w-8 text-theme-600 dark:text-theme-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground">
                      {profile.displayName || "This user"} hasn't added any projects to showcase yet.
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