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
  { bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600", icon: Users },
  { bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600", icon: Users },
  { bg: "bg-gradient-to-br from-orange-400 via-yellow-500 to-amber-600", icon: Users },
  { bg: "bg-gradient-to-br from-rose-400 via-red-500 to-pink-600", icon: Users },
  { bg: "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600", icon: Users },
  { bg: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600", icon: Users },
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
      <Card className={`group hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-0 overflow-hidden ${isFeedbackSpace ? 'ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20' : 'hover:ring-2 hover:ring-purple-500/20'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${iconConfig.bg} rounded-xl flex items-center justify-center text-white font-semibold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
              <Icon className="w-6 h-6 drop-shadow-sm" />
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