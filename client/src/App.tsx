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

  const handleLogout = () => {
    window.location.href = '/api/logout';
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
              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
              <AvatarFallback>
                {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">{(user as any)?.firstName} {(user as any)?.lastName}</span>
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 pb-16 text-center lg:pt-32">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex justify-center">
                <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl">
                  SC
                </div>
              </div>
              <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
                Team sync made{' '}
                <span className="relative whitespace-nowrap text-blue-600">
                  <span className="relative">simple</span>
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
                Create custom forms, collect team updates, and keep everyone aligned with recurring check-ins and automated newsletters.
              </p>
              <div className="mt-10 flex justify-center gap-x-6">
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  size="lg"
                  className="px-8 py-3 text-lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-blue-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Custom Forms</h3>
                  <p className="mt-2 text-slate-600">
                    Build forms with multiple question types including text, ratings, and multiple choice.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-blue-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Recurring Check-ins</h3>
                  <p className="mt-2 text-slate-600">
                    Schedule automatic reminders and collect regular updates from your team.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-blue-600">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Team Management</h3>
                  <p className="mt-2 text-slate-600">
                    Invite team members with simple codes and manage permissions effortlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
