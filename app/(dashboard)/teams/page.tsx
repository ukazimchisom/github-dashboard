"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useTeams,
  useCreateTeam,
  useDeleteTeam,
  useTeamMembers,
  useAddTeamMember,
  useRemoveTeamMember,
} from "@/hooks/useTeams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { CreateTeamSchema, AddMemberSchema } from "@/lib/utils/schemas";
import type { CreateTeamInput, AddMemberInput } from "@/lib/utils/schemas";
import type { Team } from "@/types/database";

// ============================================
// CreateTeamModal
// ============================================

function CreateTeamModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const createTeam = useCreateTeam();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(CreateTeamSchema),
  });

  async function onSubmit(data: CreateTeamInput) {
    try {
      await createTeam.mutateAsync(data);
      showToast(`Team "${data.name}" created successfully`, "success");
      reset();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create team";
      showToast(message, "error");
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Team"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Team Name"
          placeholder="e.g. Frontend Team"
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// AddMemberModal
// ============================================

function AddMemberModal({
  isOpen,
  onClose,
  teamId,
  teamName,
}: {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}) {
  const { showToast } = useToast();
  const addMember = useAddTeamMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(AddMemberSchema),
  });

  async function onSubmit(data: AddMemberInput) {
    try {
      await addMember.mutateAsync({ teamId, input: data });
      showToast(`@${data.github_username} added to ${teamName}`, "success");
      reset();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add member";
      showToast(message, "error");
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Member to ${teamName}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="GitHub Username"
          placeholder="e.g. torvalds"
          hint="Enter the GitHub username exactly as it appears on GitHub"
          error={errors.github_username?.message}
          required
          {...register("github_username")}
        />
        <Input
          label="Display Name"
          placeholder="e.g. Linus Torvalds"
          hint="Optional — shown instead of username in the dashboard"
          error={errors.display_name?.message}
          {...register("display_name")}
        />
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// TeamCard
// ============================================

function TeamCard({ team }: { team: Team }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const { showToast } = useToast();
  const deleteTeam = useDeleteTeam();
  const removeMember = useRemoveTeamMember();
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(
    team.id,
  );

  async function handleDeleteTeam() {
    if (
      !confirm(
        `Delete "${team.name}"? This will also remove all synced data for this team.`,
      )
    )
      return;
    try {
      await deleteTeam.mutateAsync(team.id);
      showToast(`Team "${team.name}" deleted`, "info");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete team";
      showToast(message, "error");
    }
  }

  async function handleRemoveMember(memberId: string, username: string) {
    if (!confirm(`Remove @${username} from this team?`)) return;
    try {
      await removeMember.mutateAsync({ memberId, teamId: team.id });
      showToast(`@${username} removed from team`, "info");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member";
      showToast(message, "error");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {team.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddMember(true)}
              >
                + Add Member
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteTeam}
                isLoading={deleteTeam.isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">
                No members yet — add GitHub usernames to track their PRs
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder with initials */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500">
                        {(member.display_name ??
                          member.github_username)[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.display_name ?? `@${member.github_username}`}
                      </p>
                      {member.display_name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          @{member.github_username}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Remove button — only visible on hover */}
                  <button
                    onClick={() =>
                      handleRemoveMember(member.id, member.github_username)
                    }
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-150 p-1 rounded"
                    title="Remove member"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        teamId={team.id}
        teamName={team.name}
      />
    </>
  );
}

// ============================================
// TeamsPage
// ============================================

export default function TeamsPage() {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const { data: teams = [], isLoading } = useTeams();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teams
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Organise your GitHub members into teams to filter dashboard metrics
          </p>
        </div>
        <Button onClick={() => setShowCreateTeam(true)}>+ New Team</Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <div className="space-y-3 pt-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && teams.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <svg
              className="w-12 h-12 text-gray-200 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No teams yet
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm mx-auto">
              Create a team and add your GitHub teammates to start tracking
              their pull request activity on the dashboard.
            </p>
            <Button onClick={() => setShowCreateTeam(true)}>
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team cards */}
      {!isLoading && teams.length > 0 && (
        <div className="grid gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Create team modal */}
      <CreateTeamModal
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
      />
    </div>
  );
}
