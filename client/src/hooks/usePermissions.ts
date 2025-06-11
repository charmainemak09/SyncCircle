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
}

export function usePermissions(spaceId?: number): UserPermissions {
  const { data: userRole } = useQuery({
    queryKey: ['/api/spaces', spaceId, 'role'],
    enabled: !!spaceId,
  });

  const role = userRole as string | undefined;

  return {
    isAdmin: role === 'admin',
    isParticipant: role === 'participant',
    canInviteMembers: role === 'admin',
    canCreateForms: role === 'admin',
    canEditForms: role === 'admin', 
    canDeleteForms: role === 'admin',
    canViewResponses: true, // Both admin and participant can view all responses
    canEditOwnResponses: true, // Both can edit their own responses
  };
}

export function useSpaceRole(spaceId: number) {
  return useQuery({
    queryKey: ['/api/spaces', spaceId, 'role'],
    enabled: !!spaceId,
  });
}