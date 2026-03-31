import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { AIChatbot } from "@/components/AIChatbot";
import { PageTransition } from "@/components/PageTransition";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Reports from "./pages/Reports";
import Resources from "./pages/Resources";
import Emergency from "./pages/Emergency";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/" element={<Layout><PageTransition><Dashboard /></PageTransition></Layout>} />
          <Route path="/map" element={<Layout><PageTransition><MapPage /></PageTransition></Layout>} />
          <Route path="/reports" element={<Layout><PageTransition><Reports /></PageTransition></Layout>} />
          <Route path="/resources" element={<Layout><PageTransition><Resources /></PageTransition></Layout>} />
          <Route path="/emergency" element={<Layout><PageTransition><Emergency /></PageTransition></Layout>} />
          <Route path="/admin" element={<Layout><PageTransition><Admin /></PageTransition></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <AIChatbot />
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
