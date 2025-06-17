import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Question } from "@shared/schema";
import { ArrowLeft, Eye, Star } from "lucide-react";

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
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [deadlineDuration, setDeadlineDuration] = useState(24);

  const isEditing = !!formId;

  // Load existing form data if editing
  const { data: existingForm, isLoading } = useQuery<{
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
    frequency: string;
    sendTime: string;
    startDate: string;
    deadlineDuration: number;
    spaceId: number;
  }>({
    queryKey: [`/api/forms/${formId}`],
    enabled: isEditing,
  });

  // Set form data when loading existing form
  useEffect(() => {
    if (existingForm && 'title' in existingForm) {
      setTitle(existingForm.title);
      setDescription(existingForm.description || "");
      setQuestions(existingForm.questions);
      setFrequency(existingForm.frequency);
      setSendTime(existingForm.sendTime);
      setStartDate(existingForm.startDate || new Date().toISOString().split('T')[0]);
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
      const targetSpaceId = isEditing ? existingForm?.spaceId : spaceId;
      if (targetSpaceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/spaces/${targetSpaceId}`] });
      }
      toast({
        title: isEditing ? "Form updated successfully" : "Form created successfully",
        description: "Your check-in form is ready to use.",
      });
      setLocation(`/spaces/${targetSpaceId || spaceId}`);
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
      startDate,
      isActive: true,
    });
  };

  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  const renderPreviewQuestion = (question: Question, index: number) => {
    const value = previewAnswers[question.id] || "";

    switch (question.type) {
      case "text":
        return (
          <Input
            placeholder="Type your answer here..."
            value={value}
            onChange={(e) => setPreviewAnswers(prev => ({ 
              ...prev, 
              [question.id]: e.target.value 
            }))}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            placeholder="Type your answer here..."
            value={value}
            onChange={(e) => setPreviewAnswers(prev => ({ 
              ...prev, 
              [question.id]: e.target.value 
            }))}
            rows={4}
          />
        );
      
      case "multiple-choice":
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => setPreviewAnswers(prev => ({ 
              ...prev, 
              [question.id]: val 
            }))}
          >
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "rating":
        const maxRating = question.maxRating || 5;
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreviewAnswers(prev => ({ 
                  ...prev, 
                  [question.id]: i + 1 
                }))}
                className={`w-8 h-8 ${
                  (value >= i + 1) ? "text-yellow-400" : "text-gray-300"
                } hover:text-yellow-400 transition-colors`}
              >
                <Star className="w-full h-full fill-current" />
              </button>
            ))}
            {value > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {value} out of {maxRating}
              </span>
            )}
          </div>
        );
      
      case "image":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500">Image upload placeholder</p>
            <p className="text-sm text-gray-400">Click to select an image</p>
          </div>
        );
      
      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500">File upload placeholder</p>
            <p className="text-sm text-gray-400">JPEG, PNG, PDF up to 10MB</p>
          </div>
        );
      
      default:
        return <p className="text-gray-500">Unknown question type</p>;
    }
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
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={questions.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Form Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Form Title */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {title || "Untitled Form"}
                  </h2>
                  {description && (
                    <p className="text-gray-600 text-sm">{description}</p>
                  )}
                </div>

                {/* Questions */}
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Label className="text-sm font-medium text-gray-900">
                            {index + 1}. {question.title || "Untitled Question"}
                            {question.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {question.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        {renderPreviewQuestion(question, index)}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">No questions to preview</p>
                      <p className="text-sm text-gray-400">
                        Add questions to see how your form will look
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Preview Submit Button */}
                {questions.length > 0 && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button className="bg-primary hover:bg-primary/90">
                      Submit Response (Preview)
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
            startDate={startDate}
            onStartDateChange={setStartDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
