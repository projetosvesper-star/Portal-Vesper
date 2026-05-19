import { apiRequest } from "./client";

export type UserLookup = {
  id: string;
  username: string;
  name: string;
  avatar_url?: string | null;
  department?: string | null;
  job_title?: string | null;
  status: string;
};

export async function searchUsers(query: string) {
  const q = encodeURIComponent(query ?? "");
  return apiRequest<UserLookup[]>(`/api/users/search?q=${q}`);
}

export async function lookupUsers(ids: string[]) {
  if (!ids.length) return [] as UserLookup[];
  const joined = encodeURIComponent(ids.join(","));
  return apiRequest<UserLookup[]>(`/api/users/lookup?ids=${joined}`);
}

