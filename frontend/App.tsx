import { ClerkProvider, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clerkPublishableKey } from "./config";
import { AppInner } from "./components/AppInner";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <SignedOut>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-foreground">Habit Tracker</h1>
                <p className="text-muted-foreground">Track your daily habits and build better routines</p>
                <SignInButton mode="modal">
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                    Sign In to Get Started
                  </button>
                </SignInButton>
              </div>
            </div>
          </SignedOut>
          <SignedIn>
            <AppInner />
          </SignedIn>
          <Toaster />
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
