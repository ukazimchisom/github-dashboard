"use client";

import { useEffect, useRef, useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamStore } from "@/store/teamStore";
import { Users } from "lucide-react";

export default function TeamSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: teams = [], isLoading } = useTeams();
  const { selectedTeamId, setSelectedTeamId } = useTeamStore();

  // Find the currently selected team object
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Auto-select the first team if none is selected and teams exist
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId, setSelectedTeamId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-9 w-40 rounded-lg" />;
  }

  if (teams.length === 0) {
    return (
      <div className="text-xs text-gray-400 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        No teams — create one in{" "}
        <a href="/teams" className="text-gray-600 underline underline-offset-2">
          Teams
        </a>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors duration-150",
          "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
          "text-gray-700 dark:text-gray-300",
          isOpen
            ? "border-gray-400 dark:border-gray-500 ring-2 ring-gray-200 dark:ring-gray-700"
            : "border-gray-200 dark:border-gray-700",
        )}
      >
        {/* Team icon */}
        <Users
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          strokeWidth={1.5}
        />

        {/* Selected team name */}
        <span className="max-w-[140px] truncate font-medium">
          {selectedTeam?.name ?? "Select team"}
        </span>

        {/* Chevron */}
        <svg
          className={cn(
            "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-30 overflow-hidden">
          <div className="p-1">
            {teams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors duration-100",
                    isSelected
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                  )}
                >
                  <span className="truncate">{team.name}</span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Link to manage teams */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-1">
            <a
              href="/teams"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Manage teams
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
