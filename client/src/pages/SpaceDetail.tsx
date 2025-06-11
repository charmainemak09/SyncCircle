import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Users, BarChart3, ClipboardCheck, Calendar, Clock, UserPlus, Copy } from "lucide-react";
import { type Form } from "@shared/schema";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

export default function SpaceDetail() {
  const { id } = useParams();
  const spaceId = parseInt(id!);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();
  
  const permissions = usePermissions(spaceId);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/spaces/${spaceId}`],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-96"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Space not found</h2>
            <p className="text-gray-600 mb-4">
              The space you're looking for doesn't exist or you don't have access.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { space, members, forms, userRole } = data as any;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(space.inviteCode);
    toast({
      title: "Invite code copied!",
      description: "Share this code with team members to invite them.",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getFormStatusColor = (form: Form) => {
    if (!form.isActive) return "bg-gray-100 text-gray-600";
    return "bg-secondary/10 text-secondary";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Space Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
            <p className="text-gray-600">
              {members.length} members • Invite code: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{space.inviteCode}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {userRole === 'admin' && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Members</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Share this invite code with team members to add them to {space.name}:
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-lg font-mono text-center">
                        {space.inviteCode}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyInviteCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Team members can use this code in the "Join Space" option on their dashboard.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Link href={`/spaces/${spaceId}/forms/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Check-in
                </Button>
              </Link>
            </>
          )}
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Description */}
      {space.description && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-gray-600">{space.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="space-y-4">
          {forms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No check-ins yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first check-in form to start gathering team updates.
                </p>
                <Link href={`/spaces/${spaceId}/forms/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Check-in Form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            forms.map((form: Form) => (
              <Card key={form.id} className="hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{form.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Every {form.frequency}</span>
                          <Clock className="w-3 h-3" />
                          <span>at {form.sendTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getFormStatusColor(form)}>
                        {form.isActive ? "Active" : "Draft"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">--</div>
                      <div className="text-sm text-gray-600">Total Responses</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">--</div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">--</div>
                      <div className="text-sm text-gray-600">Last Response</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Link href={`/forms/${form.id}/responses`}>
                      <Button variant="ghost" size="sm">View Responses</Button>
                    </Link>
                    <Link href={`/forms/${form.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit Form</Button>
                    </Link>
                    <Link href={`/forms/${form.id}/fill`}>
                      <Button size="sm">Fill Out</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>
                        {member.user.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{member.user.name}</p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <Badge variant={member.role === "admin" ? "default" : "secondary"} className="mt-1">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-600">
                Detailed analytics and insights will be available here once you have check-in data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
