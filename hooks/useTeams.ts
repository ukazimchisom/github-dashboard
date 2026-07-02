"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES, QUERY_STALE_TIME } from "@/config/constants";
import type { Team, TeamMember } from "@/types/database";
import type { CreateTeamInput, AddMemberInput } from "@/lib/utils/schemas";

// ============================================
// Fetch functions
// ============================================

async function fetchTeams(): Promise<Team[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(TABLES.TEAMS)
    .select("*")
    .eq("manager_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLES.TEAM_MEMBERS)
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================
// Mutation functions
// ============================================

async function createTeam(input: CreateTeamInput): Promise<Team> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from(TABLES.TEAMS)
    .insert({ name: input.name, manager_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteTeam(teamId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLES.TEAMS).delete().eq("id", teamId);

  if (error) throw new Error(error.message);
}

async function addTeamMember(
  teamId: string,
  input: AddMemberInput,
): Promise<TeamMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLES.TEAM_MEMBERS)
    .insert({
      team_id: teamId,
      github_username: input.github_username.toLowerCase(),
      display_name: input.display_name || null,
    })
    .select()
    .single();

  if (error) {
    // Handle duplicate member error gracefully
    if (error.code === "23505") {
      throw new Error(
        `@${input.github_username} is already a member of this team`,
      );
    }
    throw new Error(error.message);
  }
  return data;
}

async function removeTeamMember(memberId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from(TABLES.TEAM_MEMBERS)
    .delete()
    .eq("id", memberId);

  if (error) throw new Error(error.message);
}

// ============================================
// Hooks
// ============================================

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => fetchTeamMembers(teamId!),
    enabled: !!teamId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      // Invalidate teams cache so the list refreshes
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["pull-requests"] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      input,
    }: {
      teamId: string;
      input: AddMemberInput;
    }) => addTeamMember(teamId, input),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, teamId }: { memberId: string; teamId: string }) =>
      removeTeamMember(memberId),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });
}
