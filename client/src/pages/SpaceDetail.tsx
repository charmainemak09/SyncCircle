import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, Users, BarChart3, ClipboardCheck, Calendar, Clock, UserPlus, Copy, MoreVertical, Trash2, EyeOff, Eye, Send, Edit } from "lucide-react";
import { type Form } from "@shared/schema";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PendingSubmissionBadge } from "@/components/forms/PendingSubmissionBadge";

export default function SpaceDetail() {
  const { id } = useParams();
  const spaceId = parseInt(id!);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/spaces/${spaceId}`],
  });

  // Get user role for this space
  const { data: roleData } = useQuery<string>({
    queryKey: [`/api/spaces/${spaceId}/role`],
    enabled: !!spaceId,
  });

  // Get permissions - this must be called at the top level, not conditionally
  const permissions = usePermissions(spaceId, roleData);

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: number) => {
      const response = await apiRequest("DELETE", `/api/forms/${formId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}`] });
      toast({
        title: "Form deleted",
        description: "The form has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle form status mutation
  const toggleFormStatusMutation = useMutation({
    mutationFn: async ({ formId, isActive }: { formId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/forms/${formId}`, {
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}`] });
      toast({
        title: "Form updated",
        description: "Form status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update form status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete space mutation
  const deleteSpaceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/spaces/${spaceId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      toast({
        title: "Space deleted",
        description: "The space has been successfully deleted.",
      });
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete space. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Leave space mutation
  const leaveSpaceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/spaces/${spaceId}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      toast({
        title: "Left space",
        description: "You have successfully left the space.",
      });
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave space. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/spaces/${spaceId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}`] });
      toast({
        title: "Member removed",
        description: "The member has been successfully removed from the space.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit space mutation
  const editSpaceMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("PUT", `/api/spaces/${spaceId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      toast({
        title: "Space updated",
        description: "The space has been successfully updated.",
      });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update space. Please try again.",
        variant: "destructive",
      });
    },
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

  const { space, members = [], forms = [], userRole } = data as any;

  // Check if form limit is reached (max 5 forms per space)
  const hasReachedFormLimit = forms.length >= 5;

  // Debug: log the user role to verify it's being passed correctly
  console.log('Current user role:', userRole, 'Forms count:', forms.length, 'Limit reached:', hasReachedFormLimit);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(space.inviteCode);
    toast({
      title: "Invite code copied!",
      description: "Share this code with team members to invite them.",
    });
  };

  const openEditDialog = () => {
    setEditName(space.name);
    setEditDescription(space.description || "");
    setShowEditDialog(true);
  };

  const handleEditSubmit = () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Space name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    editSpaceMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim(),
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getFormStatusColor = (form: Form) => {
    if (!form.isActive) return "bg-gray-100 text-gray-600";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Space Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl">
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{space.name}</h1>
            <div className="text-sm sm:text-base text-gray-600">
              <span>{members.length} members</span>
              {permissions.canViewInviteCode && (
                <div className="mt-1 sm:mt-0 sm:inline">
                  <span className="hidden sm:inline"> • Invite code: </span>
                  <span className="sm:hidden block text-xs text-gray-500">Invite code:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm ml-0 sm:ml-1">{space.inviteCode}</code>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {permissions.canInviteMembers && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Invite Member</span>
                    <span className="sm:hidden">Invite</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Invite Team Members</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Share this invite code with team members to add them to {space.name}:
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-3 sm:py-2 rounded text-base sm:text-lg font-mono text-center break-all">
                        {space.inviteCode}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyInviteCode} className="w-full sm:w-auto">
                        <Copy className="w-4 h-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">Copy Code</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Team members can use this code in the "Join Space" option on their dashboard.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              {hasReachedFormLimit ? (
                <Button disabled className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Check-in (5/5 limit reached)</span>
                  <span className="sm:hidden">Limit Reached (5/5)</span>
                </Button>
              ) : (
                <Link href={`/spaces/${spaceId}/forms/new`}>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Form Builder ({forms.length}/5)</span>
                    <span className="sm:hidden">Form Builder ({forms.length}/5)</span>
                  </Button>
                </Link>
              )}
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {permissions.canDeleteSpace && (
                <DropdownMenuItem onClick={openEditDialog}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Space
                </DropdownMenuItem>
              )}
              {permissions.canDeleteSpace && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Space
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Space</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{space.name}"? This action cannot be undone and will permanently delete all forms, responses, and data associated with this space.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSpaceMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Space
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {permissions.canLeaveSpace && !permissions.canDeleteSpace && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <UserPlus className="w-4 h-4 mr-2 rotate-180" />
                      Leave Space
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Leave Space</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div>
                          <p>Are you sure you want to leave "{space.name}"?</p>
                          <p className="mt-2">
                            <strong>This action cannot be undone.</strong> You will:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Lose access to all forms and responses in this space</li>
                            <li>No longer receive notifications from this space</li>
                            <li>Need a new invite to rejoin this space</li>
                          </ul>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => leaveSpaceMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        disabled={leaveSpaceMutation.isPending}
                      >
                        {leaveSpaceMutation.isPending ? "Leaving..." : "Yes, Leave Space"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          {/* Form count header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Check-in Forms</h3>
              <Badge variant="outline" className={hasReachedFormLimit ? "text-red-600 border-red-300" : "text-gray-600"}>
                {forms.length}/5
              </Badge>
            </div>
            {hasReachedFormLimit && (
              <p className="text-sm text-red-600">Maximum limit reached</p>
            )}
          </div>

          {forms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first check-in form to start collecting feedback from your team.
                  <br />
                  <span className="text-sm text-gray-500">You can create up to 5 check-in forms per space.</span>
                </p>
                {permissions.canCreateForms && (
                  <Link href={`/spaces/${spaceId}/forms/new`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Check-in (0/5)
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {forms.map((form: Form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{form.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className={getFormStatusColor(form)}>
                              {form.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {form.isActive && <PendingSubmissionBadge formId={form.id} />}
                          </div>
                        </div>
                        {form.description && (
                          <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2">{form.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Created {formatTimeAgo(typeof form.createdAt === 'string' ? form.createdAt : form.createdAt.toISOString())}</span>
                          </div>
                          {form.frequency && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {form.frequency.charAt(0).toUpperCase() + form.frequency.slice(1)}
                                {form.sendTime && ` at ${form.sendTime}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <Link href={`/forms/${form.id}/fill`}>
                          <Button size="sm" className="w-full sm:w-auto">
                            <Send className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Submit Response</span>
                            <span className="sm:hidden">Submit</span>
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/responses`}>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">View Responses</span>
                            <span className="sm:hidden">Responses</span>
                          </Button>
                        </Link>
                        {permissions.canEditForms && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/forms/${form.id}/edit`}>
                                <DropdownMenuItem>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                onClick={() => toggleFormStatusMutation.mutate({
                                  formId: form.id,
                                  isActive: !form.isActive
                                })}
                              >
                                {form.isActive ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              {permissions.canDeleteForms && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{form.title}"? This action cannot be undone and will remove all associated responses.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteFormMutation.mutate(form.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-3">
            {members.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={member.user.profileImage} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {member.user.username?.slice(0, 2).toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{member.user.username}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{member.user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                      {permissions.canRemoveMembers && space.ownerId !== member.userId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.user.username} from this space? They will lose access to all content in this space.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMemberMutation.mutate(member.userId)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics coming soon</h3>
              <p className="text-gray-600">
                We're working on detailed analytics to help you understand your team's feedback patterns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Space Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Space Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter space name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe the purpose of this space..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editSpaceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editSpaceMutation.isPending || !editName.trim()}
              >
                {editSpaceMutation.isPending ? "Updating..." : "Update Space"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}