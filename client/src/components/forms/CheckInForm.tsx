import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Send, Star, Upload, X, FileImage, File, FileText, Eye, Download } from "lucide-react";
import { type Form, type Question, type Answer } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CheckInFormProps {
  form: Form;
  onSubmit?: () => void;
  editResponseId?: string;
}

interface ImageUploadFieldProps {
  questionId: string;
  currentValue?: string;
  onUpload: (url: string) => void;
}

interface FileUploadFieldProps {
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
        const data = await response.json();
        clearInterval(progressInterval);
        setUploadProgress(100);
        return data;
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
      console.log("Image upload success:", response);
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

  const handleRemoveImage = () => {
    onUpload(""); // Clear the uploaded image
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {currentValue && !selectedFile ? (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="mb-4">
            <img 
              src={currentValue} 
              alt="Uploaded image" 
              className="max-w-full max-h-48 rounded-lg object-contain border mx-auto"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium text-sm">{currentValue.split('/').pop()}</p>
                <p className="text-xs text-gray-500">Image File</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => window.open(currentValue, '_blank')}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
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
            <FileImage className="w-12 h-12 text-gray-400" />

            <div>
              <p className="text-gray-600 mb-1">
                {isDragOver 
                  ? 'Drop image here'
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
      )}

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

function FileUploadField({ questionId, currentValue, onUpload }: FileUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

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
        const response = await apiRequest("POST", "/api/upload/form-file", formData);
        const data = await response.json();
        clearInterval(progressInterval);
        setUploadProgress(100);
        return data;
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
      console.log("File upload success:", response);
      onUpload(response.fileUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateAndProcessFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG image or PDF file.",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    setSelectedFile(file);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateAndProcessFile(file)) {
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

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(extension || '')) return <FileImage className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handlePreview = () => {
    if (currentValue) {
      window.open(currentValue, '_blank');
    }
  };

  const handleDownload = () => {
    if (currentValue) {
      const link = document.createElement('a');
      link.href = currentValue;
      link.download = currentValue.split('/').pop() || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRemoveFile = () => {
    onUpload(""); // Clear the uploaded file
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {currentValue && !selectedFile ? (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          {/* Show image preview if it's an image file */}
          {currentValue.match(/\.(jpg|jpeg|png)$/i) && (
            <div className="mb-4">
              <img 
                src={currentValue} 
                alt="Uploaded file preview" 
                className="max-w-full max-h-48 rounded-lg object-contain border"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(currentValue)}
              <div>
                <p className="font-medium text-sm">{currentValue.split('/').pop()}</p>
                <p className="text-xs text-gray-500">
                  {currentValue.match(/\.(pdf)$/i) ? 'PDF Document' : 
                   currentValue.match(/\.(jpg|jpeg|png)$/i) ? 'Image File' : 'Uploaded file'}
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handlePreview}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
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
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-32 rounded-lg"
              />
            ) : (
              <File className="w-12 h-12 text-gray-400" />
            )}

            <div>
              <p className="text-gray-600 mb-1">
                {isDragOver 
                  ? 'Drop file here'
                  : selectedFile
                    ? 'File ready to upload'
                    : 'Drop files here or click to upload'
                }
              </p>
              <p className="text-sm text-gray-500">JPEG, PNG, PDF up to 10MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

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
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getFileIcon(selectedFile.name)}
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function CheckInForm({ form, onSubmit, editResponseId }: CheckInFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Load existing response for editing
  const { data: editResponse } = useQuery({
    queryKey: [`/api/responses/${editResponseId}`],
    enabled: !!editResponseId,
  });

  // Load draft response for new submissions
  const { data: draftResponse } = useQuery({
    queryKey: [`/api/forms/${form.id}/my-response`],
    enabled: !editResponseId,
  });

  // Load existing answers
  useEffect(() => {
    if (editResponseId && editResponse && typeof editResponse === 'object' && 'answers' in editResponse && editResponse.answers) {
      // Load data from the specific response being edited
      setAnswers(editResponse.answers as Record<string, any>);
    } else if (!editResponseId && draftResponse && typeof draftResponse === 'object' && 'answers' in draftResponse && draftResponse.answers) {
      // Load draft data for new submissions
      setAnswers(draftResponse.answers as Record<string, any>);
    }
  }, [editResponse, draftResponse, editResponseId]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/responses", {
      formId: form.id,
      answers: data,
      isDraft: true,
    }),
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${form.id}/my-response`] });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editResponseId) {
        // Update existing response
        return apiRequest("PUT", `/api/responses/${editResponseId}`, {
          answers: data,
          isDraft: false,
        });
      } else {
        // Create new response and clear any existing draft
        const response = await apiRequest("POST", "/api/responses", {
          formId: form.id,
          answers: data,
          isDraft: false,
        });
        
        // Clear the draft from server by submitting empty answers
        try {
          await apiRequest("POST", "/api/responses", {
            formId: form.id,
            answers: {},
            isDraft: true,
          });
        } catch (error) {
          // Ignore errors when clearing draft
          console.log("Failed to clear draft:", error);
        }
        
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${form.id}/responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${form.id}/my-response`] });
      if (editResponseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/responses/${editResponseId}`] });
      }

      if (editResponseId) {
        toast({
          title: "Response updated successfully",
          description: "Your check-in response has been updated.",
        });
      } else {
        toast({
          title: "Response submitted successfully",
          description: "Thank you for your check-in! You can submit another response anytime.",
        });
      }
      
      // Clear the form and draft for all submissions (both new and edits)
      setAnswers({});
      setLastSaved(null);
      
      // Remove cached data and invalidate queries
      queryClient.removeQueries({ queryKey: [`/api/forms/${form.id}/my-response`] });
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${form.id}/my-response`] });
      
      if (editResponseId) {
        queryClient.removeQueries({ queryKey: [`/api/responses/${editResponseId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/responses/${editResponseId}`] });
      }

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

  // Auto-save when answers change (only for new responses, not edits)
  useEffect(() => {
    if (!editResponseId && Object.keys(answers).length > 0) {
      const timeoutId = setTimeout(() => {
        autoSaveMutation.mutate(answers);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [answers, editResponseId]);

  const updateAnswer = (questionId: string, value: any) => {
    console.log("Updating answer for question:", questionId, "with value:", value);
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      console.log("New answers state:", newAnswers);
      return newAnswers;
    });
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
       if (editResponseId) {
        setLocation(`/forms/${form.id}/responses`);
      }
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{form.title}</h2>
        {form.description && (
          <p className="text-sm sm:text-base text-gray-600 mb-3">{form.description}</p>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs sm:text-sm text-blue-800">
          <div className="flex items-center justify-center space-x-2">
            <Send className="w-4 h-4 flex-shrink-0" />
            <span className="text-center">You can submit multiple responses to this check-in form</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                <Label className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
                  {index + 1}. {question.title}
                </Label>
                {question.required && (
                  <Badge variant="secondary" className="self-start sm:self-auto">Required</Badge>
                )}
              </div>

              {question.type === "text" && (
                <div className="space-y-2">
                  <Input
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                    maxLength={500}
                    className="min-h-[44px] text-base sm:text-sm"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {(answers[question.id] || "").length}/500 characters
                  </div>
                </div>
              )}

              {question.type === "textarea" && (
                <div className="space-y-2">
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    maxLength={2000}
                    className="min-h-[120px] text-base sm:text-sm resize-none"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {(answers[question.id] || "").length}/2000 characters
                  </div>
                </div>
              )}

              {question.type === "multiple-choice" && question.options && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => updateAnswer(question.id, value)}
                  className="space-y-3"
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem 
                        value={option} 
                        id={`${question.id}-${optionIndex}`}
                        className="min-w-[20px] min-h-[20px]"
                      />
                      <Label 
                        htmlFor={`${question.id}-${optionIndex}`}
                        className="text-sm sm:text-base cursor-pointer flex-1 leading-relaxed py-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "rating" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-3 sm:px-0">
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">Poor</span>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">Excellent</span>
                  </div>
                  <div className="px-2 py-4 sm:px-0 sm:py-2 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
                    <div className="w-full overflow-x-auto scrollbar-hide">
                      <div className="flex items-center justify-start sm:justify-center space-x-1 sm:space-x-2 min-w-max px-2 pb-2">
                        {Array.from({ length: question.maxRating || 10 }, (_, i) => i + 1).map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant={answers[question.id] === rating ? "default" : "outline"}
                            size="sm"
                            className={`
                              w-9 h-9 sm:w-8 sm:h-8 rounded-full text-xs font-bold touch-manipulation flex-shrink-0 
                              transition-all duration-200 ease-in-out
                              ${answers[question.id] === rating 
                                ? 'scale-110 sm:scale-105 shadow-lg ring-2 ring-primary/20' 
                                : 'hover:scale-105 hover:shadow-md'
                              }
                              focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none
                              active:scale-95
                            `}
                            onClick={() => updateAnswer(question.id, rating)}
                            aria-label={`Rate ${rating} out of ${question.maxRating || 10}`}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {answers[question.id] && (
                      <div className="text-center mt-3 sm:mt-2">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">
                          {answers[question.id]} out of {question.maxRating || 10} selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {question.type === "image" && (
                <ImageUploadField
                  questionId={question.id}
                  currentValue={answers[question.id]}
                  onUpload={(url) => updateAnswer(question.id, url)}
                />
              )}

              {question.type === "file" && (
                <FileUploadField
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
      {!editResponseId && (
        <Card className="bg-gray-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>All changes saved automatically</span>
              </div>
              <span className="text-xs text-gray-500">
                Last saved: {formatLastSaved()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => autoSaveMutation.mutate(answers)}
          disabled={autoSaveMutation.isPending}
          className="w-full sm:w-auto min-h-[44px] text-base sm:text-sm"
        >
          Save as Draft
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="w-full sm:w-auto min-h-[44px] text-base sm:text-sm flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4 flex-shrink-0" />
          <span>
            {submitMutation.isPending ? "Submitting..." : "Submit Response"}
          </span>
        </Button>
      </div>
    </div>
  );
}