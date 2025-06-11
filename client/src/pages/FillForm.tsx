import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckInForm } from "@/components/forms/CheckInForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function FillForm() {
  const { formId } = useParams();
  const [, setLocation] = useLocation();

  const { data: form, isLoading, error } = useQuery({
    queryKey: [`/api/forms/${formId}`],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Form not found</h2>
            <p className="text-gray-600 mb-4">
              The form you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => setLocation("/")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmitComplete = () => {
    setLocation(`/spaces/${form.spaceId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/spaces/${form.spaceId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Space
        </Button>
      </div>

      {/* Form */}
      <CheckInForm form={form} onSubmit={handleSubmitComplete} />
    </div>
  );
}
