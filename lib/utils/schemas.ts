import { z } from "zod";

// ============================================
// Team Schemas
// ============================================

export const CreateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less")
    .trim(),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

// ============================================
// Team Member Schemas
// ============================================

export const AddMemberSchema = z.object({
  github_username: z
    .string()
    .min(1, "GitHub username is required")
    .max(39, "GitHub usernames are max 39 characters")
    // GitHub username rules: alphanumeric and hyphens, no leading/trailing hyphens
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
      "Invalid GitHub username format",
    )
    .trim(),
  display_name: z
    .string()
    .max(100, "Display name must be 100 characters or less")
    .trim()
    .optional(),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
