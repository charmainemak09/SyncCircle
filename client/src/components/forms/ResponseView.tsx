import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Star, Clock } from "lucide-react";
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
}

export function ResponseView({ responses, questions, stats, formTitle }: ResponseViewProps) {
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

  const renderAnswer = (question: Question, answer: any) => {
    if (!answer) return <span className="text-gray-400">No answer</span>;

    switch (question.type) {
      case "rating": {
        const rating = typeof answer === 'number' ? answer : parseInt(answer);
        const maxRating = question.maxRating || 5;
        return (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {Array.from({ length: maxRating }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({rating}/{maxRating})</span>
          </div>
        );
      }
      case "multiple-choice":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {answer}
          </Badge>
        );
      case "text":
      case "textarea":
        return (
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
            {answer}
          </p>
        );
      case "image":
        return (
          <div className="text-sm text-blue-600">
            📎 {answer}
          </div>
        );
      default:
        return <span>{answer}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Response Analytics</h2>
          <p className="text-gray-600">{formTitle} • {formatTimeAgo(new Date().toISOString())}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="this-week">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold mb-2">{stats.totalResponses}</div>
            <div className="text-primary-100">Total Responses</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary to-green-600 text-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold mb-2">{stats.completionRate}%</div>
            <div className="text-green-100">Response Rate</div>
          </CardContent>
        </Card>
        
        {stats.averageRating && (
          <Card className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-2">{stats.averageRating}</div>
              <div className="text-yellow-100">Avg. Rating</div>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold mb-2">
              {responses.length > 0 ? "2.5h" : "--"}
            </div>
            <div className="text-purple-100">Avg. Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Responses */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Individual Responses</h3>
        
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
          responses.map((response) => (
            <Card key={response.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={response.user.avatar || undefined} />
                      <AvatarFallback>
                        {response.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900">{response.user.name}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Submitted {formatTimeAgo(response.submittedAt)}
                      </div>
                    </div>
                  </div>
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
          ))
        )}
      </div>
    </div>
  );
}
