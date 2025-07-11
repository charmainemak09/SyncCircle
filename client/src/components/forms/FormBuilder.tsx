import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Type, AlignLeft, List, Star, Image, File, ChevronDown } from "lucide-react";
import { type Question, type QuestionType } from "@shared/schema";

interface FormBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  title: string;
  onTitleChange: (title: string) => void;
  frequency: string;
  onFrequencyChange: (frequency: string) => void;
  sendTime: string;
  onSendTimeChange: (sendTime: string) => void;
  startDate: string;
  onStartDateChange: (startDate: string) => void;
  deadlineDuration: number;
  onDeadlineDurationChange: (duration: number) => void;
}

const questionTypes = [
  { value: "text", label: "Text Input", icon: Type },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "multiple-choice", label: "Multiple Choice", icon: List },
  { value: "rating", label: "Rating Scale", icon: Star },
  { value: "image", label: "Image Upload", icon: Image },
  { value: "file", label: "File Upload", icon: File },
] as const;

export function FormBuilder({
  questions,
  onQuestionsChange,
  title,
  onTitleChange,
  frequency,
  onFrequencyChange,
  sendTime,
  onSendTimeChange,
  startDate,
  onStartDateChange,
  deadlineDuration,
  onDeadlineDurationChange,
}: FormBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      title: "",
      required: true,
      options: type === "multiple-choice" ? ["Option 1", "Option 2"] : undefined,
      maxRating: type === "rating" ? 5 : undefined,
    };
    
    onQuestionsChange([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onQuestionsChange(
      questions.map(q => q.id === id ? { ...q, ...updates } : q)
    );
  };

  const deleteQuestion = (id: string) => {
    onQuestionsChange(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Add Question Dropdown */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-lg font-semibold text-gray-900">Form Builder</h2>
        <Select onValueChange={(value: QuestionType) => addQuestion(value)}>
          <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
            <div className="flex items-center">
              <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Add Question" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {questionTypes.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Form Builder Canvas */}
      <div>
        <div className="space-y-6">
          {/* Form Title */}
          <Card>
            <CardContent className="p-4 sm:p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter form title..."
                maxLength={100}
                className="min-h-[44px] text-base sm:text-sm"
              />
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Question {index + 1}
                  </CardTitle>
                  <div className="flex items-center justify-between sm:justify-end space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {questionTypes.find(t => t.value === question.type)?.label}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingQuestion(
                          editingQuestion === question.id ? null : question.id
                        )}
                        className="min-h-[36px] min-w-[36px] p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteQuestion(question.id)}
                        className="min-h-[36px] min-w-[36px] p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="space-y-4">
                  <Input
                    value={question.title}
                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    placeholder="Enter your question..."
                    maxLength={200}
                    className="min-h-[44px] text-base sm:text-sm"
                  />

                  {editingQuestion === question.id && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <Select
                        value={question.type}
                        onValueChange={(value: QuestionType) => 
                          updateQuestion(question.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {questionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Options</label>
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                maxLength={100}
                              />
                              {question.options!.length > 2 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeOption(question.id, optionIndex)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addOption(question.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {question.type === "rating" && (
                        <div>
                          <label className="text-sm font-medium">Max Rating</label>
                          <Select
                            value={question.maxRating?.toString() || "5"}
                            onValueChange={(value) => 
                              updateQuestion(question.id, { maxRating: parseInt(value) })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                              <SelectItem value="10">10 Points</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Question Button */}
          {questions.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">No questions added yet</p>
                <p className="text-sm text-gray-400">
                  Use the dropdown above to add questions to your form
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Settings */}
        {questions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <Select value={frequency} onValueChange={onFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send Time
                  </label>
                  <Input
                    type="time"
                    value={sendTime}
                    onChange={(e) => onSendTimeChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start From Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Deadline (Hours)
                  </label>
                  <Select 
                    value={deadlineDuration.toString()} 
                    onValueChange={(value) => onDeadlineDurationChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours (1 day)</SelectItem>
                      <SelectItem value="48">48 hours (2 days)</SelectItem>
                      <SelectItem value="72">72 hours (3 days)</SelectItem>
                      <SelectItem value="168">168 hours (1 week)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Users have this much time to submit their response after the form is sent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
