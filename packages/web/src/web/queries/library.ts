import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useLibrary(status?: "watching" | "completed" | "plan" | "dropped" | "paused") {
  return useQuery(orpc.library.list.queryOptions({ input: { status } }));
}

export function useContinueWatching() {
  return useQuery(orpc.library.continueWatching.queryOptions());
}

export function useRecommended() {
  return useQuery(orpc.library.recommended.queryOptions());
}

/** Setelah perubahan library, data library dan detail anime ikut dimuat ulang. */
export function useLibraryMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: orpc.library.key() });
    void qc.invalidateQueries({ queryKey: orpc.anime.detail.key() });
  };
  const setEntry = useMutation({ ...orpc.library.setEntry.mutationOptions(), onSuccess: refresh });
  const toggleFavorite = useMutation({ ...orpc.library.toggleFavorite.mutationOptions(), onSuccess: refresh });
  const remove = useMutation({ ...orpc.library.remove.mutationOptions(), onSuccess: refresh });
  return { setEntry, toggleFavorite, remove };
}
