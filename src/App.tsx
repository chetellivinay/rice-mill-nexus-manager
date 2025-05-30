
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QueueLine from "./pages/QueueLine";
import Billing from "./pages/Billing";
import Transactions from "./pages/Transactions";
import Store from "./pages/Store";
import Analytics from "./pages/Analytics";
import DuesAndWorkers from "./pages/DuesAndWorkers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/queue" element={<QueueLine />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/store" element={<Store />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/dues" element={<DuesAndWorkers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
