import { GameRouter } from "./components/GameRouter";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <GameRouter />
  </TooltipProvider>
);

export default App;
