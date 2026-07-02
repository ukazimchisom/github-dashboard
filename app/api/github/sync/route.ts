import { createClient } from "@/lib/supabase/server";
import { syncGitHubData } from "@/lib/github/sync";
import { TABLES } from "@/config/constants";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read teamId from request body if provided
    let requestedTeamId: string | null = null;
    try {
      const body = await request.json();
      requestedTeamId = body?.teamId ?? null;
    } catch {
      // Body may be empty — that's fine
    }

    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select("github_access_token")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_access_token) {
      return Response.json(
        {
          error:
            "GitHub access token not found. Please log out and log in again.",
        },
        { status: 401 },
      );
    }

    const accessToken = profile.github_access_token;

    // Use requested team or fall back to first team
    let teamId: string;

    if (requestedTeamId) {
      // Verify the team belongs to this user
      const { data: team } = await supabase
        .from(TABLES.TEAMS)
        .select("id")
        .eq("id", requestedTeamId)
        .eq("manager_id", user.id)
        .single();

      if (team) {
        teamId = team.id;
      } else {
        return Response.json({ error: "Team not found" }, { status: 404 });
      }
    } else {
      // Fall back to first existing team or create one
      const { data: existingTeam } = await supabase
        .from(TABLES.TEAMS)
        .select("id")
        .eq("manager_id", user.id)
        .single();

      if (existingTeam) {
        teamId = existingTeam.id;
      } else {
        const { data: newTeam, error: teamError } = await supabase
          .from(TABLES.TEAMS)
          .insert({ name: "My Team", manager_id: user.id })
          .select("id")
          .single();

        if (teamError || !newTeam) {
          return Response.json(
            { error: "Failed to create team" },
            { status: 500 },
          );
        }
        teamId = newTeam.id;
      }
    }

    const progressMessages: string[] = [];
    const result = await syncGitHubData(
      supabase,
      accessToken,
      teamId,
      (message) => progressMessages.push(message),
    );

    return Response.json({ ...result, progress: progressMessages });
  } catch (error) {
    console.error("Sync route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
