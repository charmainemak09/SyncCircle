import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface PendingSubmissionBadgeProps {
  formId: number;
}

export function PendingSubmissionBadge({ formId }: PendingSubmissionBadgeProps) {
  const { user } = useAuth();
  
  const { data: pendingData } = useQuery<{ hasPendingSubmission: boolean }>({
    queryKey: [`/api/forms/${formId}/pending-submission`],
    enabled: !!user,
  });

  if (!pendingData?.hasPendingSubmission) {
    return null;
  }

  return (
    <Badge variant="pending" className="text-xs">
      Pending Submission
    </Badge>
  );
}