import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useMyProfile(enabled = true) {
  return useQuery({ ...orpc.profile.me.queryOptions(), enabled });
}

export function usePublicProfile(username: string) {
  return useQuery(orpc.profile.byUsername.queryOptions({ input: { username } }));
}

export function useXpHistory(enabled = true) {
  return useQuery({ ...orpc.profile.xpHistory.queryOptions(), enabled });
}

export function useLeaderboard() {
  return useQuery(orpc.profile.leaderboard.queryOptions());
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.profile.checkin.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.profile.me.key() });
      void qc.invalidateQueries({ queryKey: orpc.profile.xpHistory.key() });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.profile.updateProfile.mutationOptions(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: orpc.profile.key() }),
  });
}
