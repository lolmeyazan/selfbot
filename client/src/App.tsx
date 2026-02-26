import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "./lib/store";

// Pages
import NotFound from "@/pages/not-found";
import Disclaimer from "@/pages/Disclaimer";
import Dashboard from "@/pages/Dashboard";
import Tokens from "@/pages/Tokens";
import ControlPanel from "@/pages/ControlPanel";
import TerminalPage from "@/pages/Terminal";
import DiscordClient from "@/pages/DiscordClient";
import Rules from "@/pages/Rules";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const hasAcceptedDisclaimer = useAppStore(state => state.hasAcceptedDisclaimer);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!hasAcceptedDisclaimer) {
      setLocation("/");
    }
  }, [hasAcceptedDisclaimer, setLocation]);

  if (!hasAcceptedDisclaimer) return null;
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Disclaimer} />
      <Route path="/rules" component={Rules} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/tokens">
        {() => <ProtectedRoute component={Tokens} />}
      </Route>
      <Route path="/control">
        {() => <ProtectedRoute component={ControlPanel} />}
      </Route>
      <Route path="/terminal">
        {() => <ProtectedRoute component={TerminalPage} />}
      </Route>
      <Route path="/discord">
        {() => <ProtectedRoute component={DiscordClient} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const addTerminalEvent = useAppStore(state => state.addTerminalEvent);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      addTerminalEvent({
        level: "error",
        source: "window.error",
        message: e.message || "Unknown runtime error",
      });
    };

    const onUnhandled = (e: PromiseRejectionEvent) => {
      const message =
        typeof e.reason === "string"
          ? e.reason
          : e.reason?.message || "Unhandled promise rejection";
      addTerminalEvent({
        level: "error",
        source: "window.unhandledrejection",
        message,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [addTerminalEvent]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
