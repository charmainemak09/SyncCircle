import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { Link } from "wouter";

interface SpaceCardProps {
  space: {
    id: number;
    name: string;
    description: string | null;
    memberCount: number;
    role: string;
    createdAt: string;
  };
}

const spaceIcons = [
  { bg: "bg-gradient-to-br from-primary to-indigo-600", icon: Users },
  { bg: "bg-gradient-to-br from-secondary to-green-600", icon: Users },
  { bg: "bg-gradient-to-br from-accent to-yellow-600", icon: Users },
];

export function SpaceCard({ space }: SpaceCardProps) {
  const iconConfig = spaceIcons[space.id % spaceIcons.length];
  const Icon = iconConfig.icon;

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

  // Assuming you have a way to identify the feedback space, e.g., by ID or name
  const isFeedbackSpace = space.name === "Community Feedback";

  return (
    <Link href={`/spaces/${space.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isFeedbackSpace ? 'border-2 border-purple-500 shadow-lg' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${iconConfig.bg} rounded-lg flex items-center justify-center text-white font-semibold`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{space.name}</h3>
              <p className="text-sm text-gray-500">{space.memberCount} members</p>
            </div>
          </div>

          {space.description && (
            <p className={`text-sm mb-4 line-clamp-2 ${isFeedbackSpace ? 'text-purple-700' : 'text-gray-600'}`}>
              {space.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={space.role === "admin" ? "default" : "secondary"}>
                {space.role}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeAgo(space.createdAt)}
            </div>
          </div>
        </CardContent>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
          <span className="text-primary text-sm font-medium hover:text-indigo-700">
            View Space →
          </span>
        </div>
      </Card>
    </Link>
  );
}