import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import TaskGroups from "@/pages/TaskGroups";
import Contact from "@/pages/Contact";
import BetaTesters from "@/pages/BetaTesters";
import NotFound from "@/pages/not-found";
import ScrollToTop from "@/components/ScrollToTop"; // ← AJOUT

function Router() {
  return (
    <>
      <Navigation />
      <ScrollToTop />  {/* ← AJOUT ICI */}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/features" component={Features} />
        <Route path="/groups" component={TaskGroups} />
        <Route path="/contact" component={Contact} />
        <Route path="/beta" component={BetaTesters} />
        <Route component={NotFound} />
      </Switch>
    </>
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
