import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyWebhookSignature,
  processWebhookEvent,
} from "@/lib/github/webhook";
import type { GitHubWebhookPayload } from "@/types/github";

export async function POST(request: NextRequest) {
  try {
    // Step 1 — Read the raw payload as text
    // IMPORTANT: We must read the raw body before parsing as JSON
    // because the signature is computed over the raw bytes
    const rawBody = await request.text();

    // Step 2 — Get the signature GitHub sent
    const signature = request.headers.get("x-hub-signature-256");

    // Step 3 — Get our webhook secret
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
      console.error("GITHUB_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Step 4 — Verify the signature
    // NEVER skip this step — it protects against fake webhook requests
    const isValid = verifyWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      console.warn("Webhook signature verification failed");
      // Return 401 so GitHub knows the secret is wrong
      return new Response("Invalid signature", { status: 401 });
    }

    // Step 5 — Check the event type
    // GitHub sends the event name in the X-GitHub-Event header
    const eventType = request.headers.get("x-github-event");

    // We only process pull_request events
    // Return 200 for other events so GitHub doesn't retry
    if (eventType !== "pull_request") {
      return Response.json(
        { message: `Event type '${eventType}' ignored` },
        { status: 200 },
      );
    }

    // Step 6 — Parse the payload
    let payload: GitHubWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    // Step 7 — Process the event
    // Use the service role client here so we can write to the database
    // without needing a user session (webhooks come from GitHub, not users)
    const supabase = await createClient();
    const result = await processWebhookEvent(supabase, payload);

    console.log(`[Webhook] ${result.message}`);

    // Step 8 — Always return 200 quickly
    // GitHub will retry webhooks that don't get a 200 within 10 seconds
    // Heavy processing should be done asynchronously (post-MVP)
    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("[Webhook] Error:", message);

    // Return 500 so GitHub knows to retry
    return new Response("Internal server error", { status: 500 });
  }
}
