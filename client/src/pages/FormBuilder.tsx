import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Question } from "@shared/schema";
import { ArrowLeft, Eye } from "lucide-react";

export default function FormBuilderPage() {
  const { spaceId, formId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [frequency, setFrequency] = useState("weekly");
  const [sendTime, setSendTime] = useState("09:00");

  const isEditing = !!formId;

  // Load existing form data if editing
  const { data: existingForm, isLoading } = useQuery({
    queryKey: [`/api/forms/${formId}`],
    enabled: isEditing,
  });

  // Set form data when loading existing form
  useEffect(() => {
    if (existingForm) {
      setTitle(existingForm.title);
      setDescription(existingForm.description || "");
      setQuestions(existingForm.questions as Question[]);
      setFrequency(existingForm.frequency);
      setSendTime(existingForm.sendTime);
    }
  }, [existingForm]);

  const saveFormMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/forms/${formId}`, data);
      } else {
        return apiRequest("POST", "/api/forms", {
          ...data,
          spaceId: parseInt(spaceId!),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}`] });
      toast({
        title: isEditing ? "Form updated successfully" : "Form created successfully",
        description: "Your check-in form is ready to use.",
      });
      setLocation(`/spaces/${spaceId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save form",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Form title is required",
        description: "Please enter a title for your form.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "At least one question is required",
        description: "Please add questions to your form.",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    const invalidQuestions = questions.filter(q => !q.title.trim());
    if (invalidQuestions.length > 0) {
      toast({
        title: "Please complete all questions",
        description: "Some questions are missing titles.",
        variant: "destructive",
      });
      return;
    }

    saveFormMutation.mutate({
      title,
      description,
      questions,
      frequency,
      sendTime,
      isActive: true,
    });
  };

  const handlePreview = () => {
    if (questions.length === 0) {
      toast({
        title: "No questions to preview",
        description: "Add some questions to preview the form.",
        variant: "destructive",
      });
      return;
    }
    // Could implement a preview modal here
    toast({
      title: "Preview coming soon",
      description: "Form preview functionality will be available soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/spaces/${spaceId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Space
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Form" : "Form Builder"}
            </h1>
            <p className="text-gray-600">
              {isEditing ? "Update your check-in form" : "Create custom check-in forms for your team"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveFormMutation.isPending}
          >
            {saveFormMutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Form" : "Save Form")
            }
          </Button>
        </div>
      </div>

      {/* Form Builder */}
      <Card>
        <CardContent className="p-8">
          <FormBuilder
            questions={questions}
            onQuestionsChange={setQuestions}
            title={title}
            onTitleChange={setTitle}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            sendTime={sendTime}
            onSendTimeChange={setSendTime}
          />
        </CardContent>
      </Card>
    </div>
  );
}
