import { createClient } from "@/lib/supabase/server";
import { syncGitHubData } from "@/lib/github/sync";
import { TABLES } from "@/config/constants";

export async function POST() {
  try {
    const supabase = await createClient();

    // Verify the user is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the GitHub access token from our profiles table
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

    // Get or create the user's default team
    let teamId: string;

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
        .insert({
          name: "My Team",
          manager_id: user.id,
        })
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

    // Run the sync
    const progressMessages: string[] = [];

    const result = await syncGitHubData(
      supabase,
      accessToken,
      teamId,
      (message) => progressMessages.push(message),
    );

    return Response.json({
      ...result,
      progress: progressMessages,
    });
  } catch (error) {
    console.error("Sync route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
