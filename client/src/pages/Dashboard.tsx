import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Users } from "lucide-react";
import { useState } from "react";

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Spaces</h2>
            <p className="text-gray-600 mt-1">
              Manage your team collaboration spaces and check-ins
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">Join Space</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Space</DialogTitle>
                  <DialogDescription>
                    Enter the invite code to join an existing space.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter invite code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => joinSpaceMutation.mutate(joinCode)}
                      disabled={!joinCode || joinSpaceMutation.isPending}
                    >
                      {joinSpaceMutation.isPending ? "Joining..." : "Join Space"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <CreateSpaceDialog />
          </div>
        </div>
      </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to SyncCircle!
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first space to start collaborating with your team on recurring check-ins.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <CreateSpaceDialog />
              <Button
                variant="outline"
                onClick={() => setJoinDialogOpen(true)}
                className="w-full sm:w-auto"
              >
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
          {spaces.filter(space => space.name !== "Community Feedback").length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Your Spaces
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spaces
                  .filter(space => space.name !== "Community Feedback")
                  .map((space: any) => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}