import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";
import { appBaseUrl, signOAuthState } from "@/lib/oauth-state";

export const dynamic = "force-dynamic";

const PROVIDERS = ["SLACK", "GITHUB", "GOOGLE_CALENDAR"] as const;

/**
 * Starts OAuth — redirects to the provider authorize page.
 * Query: ?provider=SLACK|GITHUB|GOOGLE_CALENDAR
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") ?? "";
    if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number])) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    let state: string;
    try {
      state = await signOAuthState({ ventureId, userId, provider });
    } catch {
      return NextResponse.json({ error: "Server misconfigured (JWT_SECRET)" }, { status: 500 });
    }

    const redirectUri = `${appBaseUrl()}/api/oauth/integration/callback`;
    const enc = encodeURIComponent;

    const settingsUrl = `${appBaseUrl()}/ventures/${ventureId}/settings/integrations`;

    if (provider === "SLACK") {
      const id = process.env.SLACK_CLIENT_ID;
      if (!id) {
        return NextResponse.redirect(`${settingsUrl}?oauth=slack_missing_env`);
      }
      const scope = process.env.SLACK_SCOPES ?? "channels:join,chat:write,commands";
      const url = `https://slack.com/oauth/v2/authorize?client_id=${enc(id)}&scope=${enc(scope)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}`;
      return NextResponse.redirect(url);
    }

    if (provider === "GITHUB") {
      const id = process.env.GITHUB_CLIENT_ID;
      if (!id) {
        return NextResponse.redirect(`${settingsUrl}?oauth=github_missing_env`);
      }
      const scope = process.env.GITHUB_SCOPES ?? "repo read:user";
      const url = `https://github.com/login/oauth/authorize?client_id=${enc(id)}&redirect_uri=${enc(redirectUri)}&scope=${enc(scope)}&state=${enc(state)}`;
      return NextResponse.redirect(url);
    }

    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) {
      return NextResponse.redirect(`${settingsUrl}?oauth=google_missing_env`);
    }
    const scope =
      process.env.GOOGLE_CALENDAR_SCOPES ?? "https://www.googleapis.com/auth/calendar.events";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${enc(id)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc(scope)}&state=${enc(state)}&access_type=offline&prompt=consent`;
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("[oauth/start]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
