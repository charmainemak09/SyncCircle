import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Send, Star, Upload, X, FileImage } from "lucide-react";
import { type Form, type Question, type Answer } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CheckInFormProps {
  form: Form;
  onSubmit?: () => void;
}

interface ImageUploadFieldProps {
  questionId: string;
  currentValue?: string;
  onUpload: (url: string) => void;
}

function ImageUploadField({ questionId, currentValue, onUpload }: ImageUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Upload mutation called with file:", file.name, file.size, file.type);
      const formData = new FormData();
      formData.append("image", file);
      console.log("FormData created:", formData.get("image"));
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      try {
        const response = await apiRequest("POST", "/api/upload/form-image", formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    },
    onSuccess: (response: any) => {
      onUpload(response.imageUrl);
      setSelectedFile(null);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateAndProcessFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG or PNG image.",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (file && validateAndProcessFile(file)) {
      console.log("File validated, starting upload:", file.name, file.size);
      uploadMutation.mutate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateAndProcessFile(file)) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <div className="flex flex-col items-center space-y-2">
          {currentValue ? (
            <img 
              src={currentValue} 
              alt="Uploaded" 
              className="max-w-full max-h-48 rounded-lg"
            />
          ) : (
            <FileImage className="w-12 h-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-gray-600 mb-1">
              {isDragOver 
                ? 'Drop image here'
                : currentValue
                  ? 'Click to replace image'
                  : 'Drop files here or click to upload'
              }
            </p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="text-xs text-gray-600">
          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
    </div>
  );
}

export function CheckInForm({ form, onSubmit }: CheckInFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing response
  const { data: existingResponse } = useQuery({
    queryKey: [`/api/forms/${form.id}/my-response`],
  });

  // Load existing answers
  useEffect(() => {
    if (existingResponse && typeof existingResponse === 'object' && 'answers' in existingResponse && existingResponse.answers) {
      setAnswers(existingResponse.answers as Record<string, any>);
    }
  }, [existingResponse]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/responses", {
      formId: form.id,
      answers: data,
      isDraft: true,
    }),
    onSuccess: () => {
      setLastSaved(new Date());
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/responses", {
      formId: form.id,
      answers: data,
      isDraft: false,
    }),
    onSuccess: () => {
      toast({
        title: "Response submitted successfully",
        description: "Thank you for your check-in!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${form.id}/my-response`] });
      onSubmit?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit response",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save when answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const timeoutId = setTimeout(() => {
        autoSaveMutation.mutate(answers);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [answers]);

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Validate required questions
    const questions = form.questions as Question[];
    const missingRequired = questions
      .filter(q => q.required && !answers[q.id])
      .map(q => q.title);

    if (missingRequired.length > 0) {
      toast({
        title: "Please complete all required fields",
        description: `Missing: ${missingRequired.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(answers);
  };

  const questions = form.questions as Question[];

  const formatLastSaved = () => {
    if (!lastSaved) return "Never";
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h2>
        {form.description && (
          <p className="text-gray-600">{form.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-medium text-gray-900">
                  {index + 1}. {question.title}
                </Label>
                {question.required && (
                  <Badge variant="secondary">Required</Badge>
                )}
              </div>

              {question.type === "text" && (
                <Input
                  value={answers[question.id] || ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                />
              )}

              {question.type === "textarea" && (
                <Textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                />
              )}

              {question.type === "multiple-choice" && question.options && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => updateAnswer(question.id, value)}
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                      <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "rating" && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Poor</span>
                  <div className="flex space-x-2">
                    {Array.from({ length: question.maxRating || 5 }, (_, i) => i + 1).map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant={answers[question.id] === rating ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 rounded-full"
                        onClick={() => updateAnswer(question.id, rating)}
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">Excellent</span>
                </div>
              )}

              {question.type === "image" && (
                <ImageUploadField
                  questionId={question.id}
                  currentValue={answers[question.id]}
                  onUpload={(url) => updateAnswer(question.id, url)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auto-save indicator */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4 text-secondary" />
              <span>All changes saved automatically</span>
            </div>
            <span className="text-xs text-gray-500">
              Last saved: {formatLastSaved()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => autoSaveMutation.mutate(answers)}
          disabled={autoSaveMutation.isPending}
        >
          Save as Draft
        </Button>
        
        <div className="flex space-x-4">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitMutation.isPending ? "Submitting..." : "Submit Response"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
