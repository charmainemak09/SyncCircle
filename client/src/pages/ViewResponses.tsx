import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ResponseView } from "@/components/forms/ResponseView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

  const groupResponsesByPeriod = (responses: any[]) => {
    // Group responses by submission date (check-in period)
    const groups = responses.reduce((acc, response) => {
      const submissionDate = new Date(response.submittedAt);
      const dateKey = submissionDate.toDateString();
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: submissionDate,
          responses: []
        };
      }
      acc[dateKey].responses.push(response);
      return acc;
    }, {});

    // Sort groups by date (newest first)
    return Object.values(groups).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const renderGroupedView = () => {
    const groupedData = groupResponsesByPeriod(responses);
    
    return (
      <div className="space-y-8">
        {groupedData.map((group: any, index) => (
          <Card key={index} className="overflow-hidden">
            {/* Newsletter-style header */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {(form as any).title} - Check-in
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {group.date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {group.responses.length} response{group.responses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Response content */}
            <CardContent className="p-6">
              <div className="space-y-8">
                {group.responses.map((response: any, responseIndex: number) => (
                  <div key={responseIndex}>
                    {responseIndex > 0 && <Separator className="mb-8" />}
                    <div className="border-l-4 border-primary/20 pl-6 py-2">
                      {/* User header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={response.user.profileImageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                            {response.user.firstName?.[0]}{response.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {response.user.firstName} {response.user.lastName}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(response.submittedAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      {response.userId === (user as any)?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Your Response
                        </span>
                      )}
                    </div>
                    
                    {/* User's answers */}
                    <div className="space-y-4">
                      {questions.map((question: Question) => {
                        const answer = response.answers[question.id];
                        if (!answer) return null;
                        
                        return (
                          <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">{question.title}</h5>
                            <div className="text-gray-700">
                              {question.type === 'image' && answer ? (
                                <img 
                                  src={answer} 
                                  alt="Response" 
                                  className="max-w-sm rounded-lg border" 
                                />
                              ) : question.type === 'file' && answer ? (
                                <a 
                                  href={answer} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-primary hover:underline"
                                >
                                  📎 View attached file
                                </a>
                              ) : question.type === 'rating' ? (
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: question.maxRating || 5 }, (_, i) => (
                                    <span key={i} className={i < answer ? "text-yellow-400" : "text-gray-300"}>
                                      ⭐
                                    </span>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">({answer}/{question.maxRating || 5})</span>
                                </div>
                              ) : Array.isArray(answer) ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {answer.map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="whitespace-pre-wrap">{answer}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

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
          <div className="flex items-center space-x-2">
            <Label htmlFor="group-toggle" className="text-sm font-medium">
              Group by Check-in Period
            </Label>
            <Switch
              id="group-toggle"
              checked={groupByPeriod}
              onCheckedChange={setGroupByPeriod}
            />
          </div>
        </div>
      </div>

      {/* Response View */}
      {groupByPeriod ? (
        renderGroupedView()
      ) : (
        <ResponseView
          responses={responses}
          questions={questions}
          stats={stats}
          formTitle={(form as any).title}
          currentUserId={(user as any)?.id}
        />
      )}
    </div>
  );
}
