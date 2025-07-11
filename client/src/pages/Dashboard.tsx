import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Users, Plus } from "lucide-react";
import { useState } from "react";
import { TeamCollaborationIllustration, EmptyStateIllustration } from "@/components/ui/illustrations";

export default function Dashboard() {
  const [joinCode, setJoinCode] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ["/api/spaces"],
  });

  const joinSpaceMutation = useMutation({
    mutationFn: (inviteCode: string) => apiRequest("POST", "/api/spaces/join", { inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      toast({
        title: "Successfully joined space",
        description: "You can now participate in check-ins for this space.",
      });
      setJoinDialogOpen(false);
      setJoinCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join space",
        description: error.message || "Please check the invite code and try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-blue-600/10 backdrop-blur-sm">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent mb-6">
                SyncCircle
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Transform team collaboration with intelligent check-ins, beautiful forms, and real-time insights that keep everyone connected.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <CreateSpaceDialog />
                <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm hover:bg-white/90 border-purple-200">
                      <Users className="mr-2 h-5 w-5" />
                      Join Space
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="backdrop-blur-md bg-white/95">
                    <DialogHeader>
                      <DialogTitle className="text-gradient">Join a Space</DialogTitle>
                      <DialogDescription>
                        Enter the invite code to join an existing space
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter invite code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="bg-white/80 backdrop-blur-sm"
                      />
                      <Button 
                        onClick={() => joinSpaceMutation.mutate(joinCode)}
                        disabled={!joinCode || joinSpaceMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                      >
                        {joinSpaceMutation.isPending ? "Joining..." : "Join Space"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 relative">
                <TeamCollaborationIllustration />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spaces Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Your Spaces</h2>
              <p className="text-gray-600 mt-2 text-lg">
                Manage your team collaboration spaces and check-ins
              </p>
            </div>
          </div>
        </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent>
            <div className="w-48 h-32 mx-auto mb-8">
              <EmptyStateIllustration />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
              Welcome to SyncCircle!
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Create your first space to start collaborating with your team on recurring check-ins and beautiful surveys.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <CreateSpaceDialog />
              <Button
                variant="outline"
                onClick={() => setJoinDialogOpen(true)}
                className="w-full sm:w-auto bg-white/80 backdrop-blur-sm hover:bg-white/90 border-purple-200"
                size="lg"
              >
                <Users className="mr-2 h-5 w-5" />
                Join Existing Space
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Community Feedback Space (if exists) */}
          {spaces.find(space => space.name === "Community Feedback") && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                Community Space
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SpaceCard space={spaces.find(space => space.name === "Community Feedback")!} />
              </div>
            </div>
          )}

          {/* Other Spaces */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Your Spaces
            </h3>
            {spaces.filter(space => space.name !== "Community Feedback").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spaces
                  .filter(space => space.name !== "Community Feedback")
                  .map((space: any) => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No personal spaces yet
                </h4>
                <p className="text-gray-600 mb-4">
                  Create a space for your team or join an existing one to start collaborating.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <CreateSpaceDialog />
                  <Button
                    variant="outline"
                    onClick={() => setJoinDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Join Space
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}