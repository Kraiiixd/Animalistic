import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useHome() {
  return useQuery(orpc.anime.home.queryOptions());
}

export function useSchedule() {
  return useQuery(orpc.anime.schedule.queryOptions());
}

export function useGenres() {
  return useQuery(orpc.anime.genres.queryOptions());
}

export function useAnimeList(input: {
  q?: string;
  type?: "series" | "movie" | "ova" | "ona";
  status?: "ongoing" | "completed" | "upcoming";
  genre?: string;
  sort?: "trending" | "popular" | "latest" | "rating" | "title" | "year";
}) {
  return useQuery(orpc.anime.list.queryOptions({ input: { ...input, limit: 60, offset: 0 } }));
}

export function useAnimeDetail(slug: string) {
  return useQuery(orpc.anime.detail.queryOptions({ input: { slug } }));
}
