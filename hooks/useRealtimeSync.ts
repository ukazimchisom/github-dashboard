"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useTeamStore } from "@/store/teamStore";
import { TABLES } from "@/config/constants";

// ============================================
// useRealtimeSync
// ============================================
// Subscribes to Supabase real-time changes on
// the pull_requests table for the selected team.
//
// When a webhook updates a PR in the database,
// Supabase broadcasts the change to all subscribers.
// We respond by invalidating TanStack Query's cache
// so the dashboard refetches and shows fresh data.
//
// Flow:
// GitHub event → Webhook POST → Database upsert
//   → Supabase realtime → useRealtimeSync → invalidateQueries
//   → TanStack Query refetch → Dashboard updates

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId);

  useEffect(() => {
    if (!selectedTeamId) return;

    const supabase = createClient();

    // Subscribe to any INSERT or UPDATE on pull_requests
    // filtered to the current team
    const channel = supabase
      .channel(`pull-requests-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: TABLES.PULL_REQUESTS,
          filter: `team_id=eq.${selectedTeamId}`,
        },
        (payload) => {
          console.log("[Realtime] PR change detected:", payload.eventType);

          // Invalidate all PR-related queries
          // TanStack Query will refetch in the background
          queryClient.invalidateQueries({
            queryKey: ["pull-requests"],
          });
          queryClient.invalidateQueries({
            queryKey: ["pull-requests-list"],
          });
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status: ${status}`);
      });

    // Cleanup: unsubscribe when team changes or component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeamId, queryClient]);
}
