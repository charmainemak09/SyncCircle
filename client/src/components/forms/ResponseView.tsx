import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Download, Star, Clock, Edit } from "lucide-react";
import { type Response, type User, type Question } from "@shared/schema";

interface ResponseViewProps {
  responses: (Response & { user: User })[];
  questions: Question[];
  stats: {
    totalResponses: number;
    completionRate: number;
    averageRating?: number;
  };
  formTitle: string;
  currentUserId?: string;
  formFrequency?: string;
}

export function ResponseView({ responses, questions, stats, formTitle, currentUserId, formFrequency }: ResponseViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, setLocation] = useLocation();

  // Calculate pagination
  const totalItems = responses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResponses = responses.slice(startIndex, endIndex);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleEditResponse = (response: Response & { user: User }) => {
    // Navigate to the form with the response data for editing
    setLocation(`/forms/${response.formId}/fill?edit=${response.id}`);
  };

  const renderAnswer = (question: Question, answer: any) => {
    const containerClass = "bg-gray-50 border border-gray-200 rounded-lg p-4";
    const textClass = "text-gray-700 text-sm font-normal leading-relaxed";

    if (!answer && answer !== 0) {
      return (
        <div className={containerClass}>
          <span className="text-gray-400 text-sm font-normal italic">No response</span>
        </div>
      );
    }

    switch (question.type) {
      case "rating": {
        const rating = typeof answer === 'number' ? answer : parseInt(answer);
        const maxRating = question.maxRating || 5;
        return (
          <div className={containerClass}>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1" role="img" aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
                {Array.from({ length: maxRating }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating ? "text-blue-500 fill-current" : "text-gray-300"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className={textClass}>
                {rating} out of {maxRating}
              </span>
            </div>
          </div>
        );
      }
      case "multiple-choice":
        return (
          <div className={containerClass}>
            <span className={textClass}>
              {answer}
            </span>
          </div>
        );
      case "text":
      case "textarea":
        return (
          <div className={containerClass}>
            <p className={`${textClass} whitespace-pre-wrap`}>
              {answer}
            </p>
          </div>
        );
      case "image":
        return (
          <div className={containerClass}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-xs">🖼️</span>
              </div>
              <div className="flex-1">
                <p className={textClass}>Image uploaded</p>
                <a 
                  href={answer} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${textClass} text-gray-600 hover:text-gray-800 underline`}
                >
                  View image
                </a>
              </div>
            </div>
          </div>
        );
      case "file":
        return (
          <div className={containerClass}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-xs">📎</span>
              </div>
              <div className="flex-1">
                <p className={textClass}>File uploaded</p>
                <a 
                  href={answer} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${textClass} text-gray-600 hover:text-gray-800 underline`}
                >
                  {answer.split('/').pop() || 'View file'}
                </a>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className={containerClass}>
            <span className={textClass}>{answer}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Response Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{formTitle} • {formatTimeAgo(new Date().toISOString())}</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <Button className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
        <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold mb-2">{stats.totalResponses}</div>
            <div className="text-primary-100 text-xs sm:text-sm">Total Responses</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary to-green-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold mb-2">{stats.completionRate}%</div>
            <div className="text-green-100 text-xs sm:text-sm">
              Response Rate {formFrequency ? `(${formFrequency})` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Responses */}
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Individual Responses</h3>
          {responses.length > 0 && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <Select defaultValue="this-week">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {responses.length > 0 && (
          <div className="flex items-center justify-between border-b pb-4">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} responses
            </p>
          </div>
        )}

        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No responses yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Responses will appear here once team members submit their check-ins
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentResponses.map((response) => (
              <Card key={response.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={response.user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {response.user.firstName?.[0]}{response.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {response.user.firstName} {response.user.lastName}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Submitted {formatTimeAgo(response.submittedAt.toString())}
                        </div>
                      </div>
                    </div>
                    {currentUserId === response.user.id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditResponse(response)}
                        className="flex items-center space-x-2"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Response</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {questions.map((question) => {
                      const answer = (response.answers as any)[question.id];
                      return (
                        <div key={question.id}>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {question.title}:
                          </p>
                          {renderAnswer(question, answer)}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return page === 1 || 
                               page === totalPages || 
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, filteredPages) => (
                        <PaginationItem key={page}>
                          {index > 0 && filteredPages[index - 1] < page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}