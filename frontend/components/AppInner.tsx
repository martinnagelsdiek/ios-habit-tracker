import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayView } from "./TodayView";
import { ProgressView } from "./ProgressView";
import { HabitsView } from "./HabitsView";
import { Header } from "./Header";
import { Home, TrendingUp, Target } from "lucide-react";

export function AppInner() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today">
            <TodayView />
          </TabsContent>
          
          <TabsContent value="habits">
            <HabitsView />
          </TabsContent>
          
          <TabsContent value="progress">
            <ProgressView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
