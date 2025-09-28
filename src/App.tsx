import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <div className="flex h-screen">
                    <Navigation />
                    <main className="flex-1 overflow-auto">
                      <Dashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/conversations" 
              element={
                <ProtectedRoute>
                  <div className="flex h-screen">
                    <Navigation />
                    <main className="flex-1 overflow-auto">
                      <Conversations />
                    </main>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="flex h-screen">
                    <Navigation />
                    <main className="flex-1 overflow-auto">
                      <Settings />
                    </main>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
