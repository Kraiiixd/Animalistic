import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { redirectReady } from "../lib/auth";

const queryClient = new QueryClient();

interface ProviderProps {
  children: React.ReactNode;
}

// App-level providers — add theme/context providers here, wrapping children.
// QueryClientProvider must stay (all API calls run through TanStack Query).
// Children mount only after a returning managed sign-in is exchanged, so the
// first requests already carry the bearer token.
export function Provider({ children }: ProviderProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void redirectReady.then(() => setReady(true));
  }, []);
  if (!ready) return null;
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
