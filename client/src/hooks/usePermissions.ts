import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

export interface UserPermissions {
  isAdmin: boolean;
  isParticipant: boolean;
  canInviteMembers: boolean;
  canCreateForms: boolean;
  canEditForms: boolean;
  canDeleteForms: boolean;
  canViewResponses: boolean;
  canEditOwnResponses: boolean;
  canEditAllResponses: boolean;
  canViewInviteCode: boolean;
  canDeleteSpace: boolean;
  canRemoveMembers: boolean;
  canLeaveSpace: boolean;
}

export function usePermissions(spaceId?: number, userRole?: string): UserPermissions {
  const { data: fetchedRole } = useQuery({
    queryKey: ['/api/spaces', spaceId, 'role'],
    enabled: !!spaceId && !userRole,
  });

  const role = userRole || (fetchedRole as string | undefined);

  return {
    isAdmin: role === 'admin',
    isParticipant: role === 'participant',
    canInviteMembers: role === 'admin', // Only admins can invite members
    canCreateForms: role === 'admin',
    canEditForms: role === 'admin', 
    canDeleteForms: role === 'admin',
    canViewResponses: true, // Both admin and participant can view all responses
    canEditOwnResponses: true, // Both can edit their own responses
    canEditAllResponses: role === 'admin', // Only admins can edit any response
    canViewInviteCode: role === 'admin', // Only admins can view invite code
    canDeleteSpace: role === 'admin', // Only admins can delete space
    canRemoveMembers: role === 'admin', // Only admins can remove members
    canLeaveSpace: true, // Both admin and participant can leave space
  };
}

export function useSpaceRole(spaceId: number) {
  return useQuery({
    queryKey: ['/api/spaces', spaceId, 'role'],
    enabled: !!spaceId,
  });
}