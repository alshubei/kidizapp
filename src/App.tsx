import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import ShapeGame from "@/pages/ShapeGame";
import MathGame from "@/pages/MathGame";
import GamePage from "@/pages/GamePage";
import AgeRoute from "@/pages/AgeRoute";
import NotFound from "@/pages/NotFound";

const App = () => (
  <TooltipProvider>
    <BrowserRouter>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/game/shape" element={<ShapeGame />} />
        <Route path="/game/math" element={<MathGame />} />
        <Route path="/age/:age" element={<AgeRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
