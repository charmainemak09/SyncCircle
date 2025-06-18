import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ResponseView } from "@/components/forms/ResponseView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Users, Clock } from "lucide-react";
import { type Question } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function ViewResponses() {
  const { formId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [groupByPeriod, setGroupByPeriod] = useState(false);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: [`/api/forms/${formId}`],
  });

  const { data: responseData, isLoading: responsesLoading } = useQuery({
    queryKey: [`/api/forms/${formId}/responses`],
    enabled: !!form,
  });

  const isLoading = formLoading || responsesLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!form || !responseData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Form or responses not found
            </h2>
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

  const { responses, stats } = responseData as any;
  const questions = (form as any).questions as Question[];


  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/spaces/${(form as any).spaceId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Space
        </Button>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{(form as any).title} Responses</h1>

        </div>
      </div>

      {/* Response View */}

        <ResponseView
          responses={responses}
          questions={questions}
          stats={stats}
          formTitle={(form as any).title}
          currentUserId={(user as any)?.id}
        />

    </div>
  );
}