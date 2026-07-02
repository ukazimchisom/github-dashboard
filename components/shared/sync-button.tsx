"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTeamStore } from "@/store/teamStore";
import { useQueryClient } from "@tanstack/react-query";

type SyncResult = {
  success: boolean;
  repositoriesSynced: number;
  pullRequestsSynced: number;
  errors: string[];
  progress: string[];
};

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId);
  const queryClient = useQueryClient();

  async function handleSync() {
    try {
      setIsSyncing(true);
      showToast("Starting GitHub sync...", "info");

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass selected team ID so sync targets the right team
        body: JSON.stringify({ teamId: selectedTeamId }),
      });

      const result: SyncResult = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0] ?? "Sync failed");
      }

      if (result.success) {
        showToast(
          `Sync complete! ${result.repositoriesSynced} repos, ${result.pullRequestsSynced} PRs synced.`,
          "success",
        );
        // Invalidate queries so dashboard refreshes with new data
        queryClient.invalidateQueries({ queryKey: ["pull-requests"] });
        queryClient.invalidateQueries({ queryKey: ["pull-requests-list"] });
      } else {
        throw new Error(result.errors?.[0] ?? "Sync failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      showToast(message, "error");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Button
      onClick={handleSync}
      isLoading={isSyncing}
      variant="primary"
      size="sm"
    >
      {isSyncing ? "Syncing..." : "Sync GitHub Data"}
    </Button>
  );
}
