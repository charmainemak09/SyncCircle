import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/components/auth/LoginPage";
import Dashboard from "@/pages/Dashboard";
import SpaceDetail from "@/pages/SpaceDetail";
import FormBuilder from "@/pages/FormBuilder";
import FillForm from "@/pages/FillForm";
import ViewResponses from "@/pages/ViewResponses";
import NotFound from "@/pages/not-found";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { Link } from "wouter";

function AppNavigation() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-4">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
              SC
            </div>
            <h1 className="text-xl font-semibold text-gray-900">SyncCircle</h1>
          </a>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">{user?.firstName} {user?.lastName}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            SC
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/spaces/:id" component={SpaceDetail} />
        <Route path="/spaces/:spaceId/forms/new" component={FormBuilder} />
        <Route path="/forms/:formId/edit" component={FormBuilder} />
        <Route path="/forms/:formId/fill" component={FillForm} />
        <Route path="/forms/:formId/responses" component={ViewResponses} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
