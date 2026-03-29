import { NextResponse } from "next/server";
import type { IntegrationProvider } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";
import { appBaseUrl, verifyOAuthState } from "@/lib/oauth-state";
import { auditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

/**
 * OAuth redirect URI registered with Slack / GitHub / Google.
 * Exchanges `code` for tokens when provider credentials are configured.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthErr = searchParams.get("error");

    if (!state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    let parsed: { ventureId: string; userId: string; provider: string };
    try {
      parsed = await verifyOAuthState(state);
    } catch {
      return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
    }

    const { ventureId, userId, provider } = parsed;
    const base = appBaseUrl();
    const back = `${base}/ventures/${ventureId}/settings/integrations`;

    const sessionUser = await getOrCreateUserFromClerk();
    if (!sessionUser || sessionUser !== userId) {
      return NextResponse.redirect(`${back}?oauth=session_mismatch`);
    }

    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.redirect(`${back}?oauth=forbidden`);
    }

    if (oauthErr) {
      return NextResponse.redirect(`${back}?oauth=${encodeURIComponent(oauthErr)}`);
    }
    if (!code) {
      return NextResponse.redirect(`${back}?oauth=missing_code`);
    }

    const redirectUri = `${base}/api/oauth/integration/callback`;

    if (provider === "SLACK") {
      const clientId = process.env.SLACK_CLIENT_ID;
      const clientSecret = process.env.SLACK_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${back}?oauth=slack_not_configured`);
      }

      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = (await tokenRes.json()) as { ok?: boolean; access_token?: string; team?: { id?: string; name?: string } };

      if (!data.ok || !data.access_token) {
        return NextResponse.redirect(`${back}?oauth=slack_token_failed`);
      }

      await prisma.integrationConnection.upsert({
        where: { ventureId_provider: { ventureId, provider: "SLACK" } },
        create: {
          ventureId,
          userId,
          provider: "SLACK",
          connected: true,
          accessToken: data.access_token,
          metadata: { team: data.team ?? null },
        },
        update: {
          connected: true,
          userId,
          accessToken: data.access_token,
          metadata: { team: data.team ?? null },
        },
      });

      void auditLog({
        userId,
        ventureId,
        action: "INTEGRATION_OAUTH",
        resourceType: "IntegrationConnection",
        metadata: { provider: "SLACK" },
        request,
      });

      return NextResponse.redirect(`${back}?oauth=success&p=SLACK`);
    }

    if (provider === "GITHUB") {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${back}?oauth=github_not_configured`);
      }

      const ghBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: ghBody,
      });
      const data = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!data.access_token) {
        return NextResponse.redirect(`${back}?oauth=github_token_failed`);
      }

      await prisma.integrationConnection.upsert({
        where: { ventureId_provider: { ventureId, provider: "GITHUB" } },
        create: {
          ventureId,
          userId,
          provider: "GITHUB",
          connected: true,
          accessToken: data.access_token,
          metadata: {},
        },
        update: {
          connected: true,
          userId,
          accessToken: data.access_token,
        },
      });

      void auditLog({
        userId,
        ventureId,
        action: "INTEGRATION_OAUTH",
        resourceType: "IntegrationConnection",
        metadata: { provider: "GITHUB" },
        request,
      });

      return NextResponse.redirect(`${back}?oauth=success&p=GITHUB`);
    }

    if (provider === "GOOGLE_CALENDAR") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${back}?oauth=google_not_configured`);
      }

      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = (await tokenRes.json()) as { access_token?: string; refresh_token?: string; error?: string };
      if (!data.access_token) {
        return NextResponse.redirect(`${back}?oauth=google_token_failed`);
      }

      await prisma.integrationConnection.upsert({
        where: { ventureId_provider: { ventureId, provider: "GOOGLE_CALENDAR" } },
        create: {
          ventureId,
          userId,
          provider: "GOOGLE_CALENDAR",
          connected: true,
          accessToken: data.access_token,
          metadata: { refresh_token: data.refresh_token ?? null },
        },
        update: {
          connected: true,
          userId,
          accessToken: data.access_token,
          metadata: { refresh_token: data.refresh_token ?? null },
        },
      });

      void auditLog({
        userId,
        ventureId,
        action: "INTEGRATION_OAUTH",
        resourceType: "IntegrationConnection",
        metadata: { provider: "GOOGLE_CALENDAR" },
        request,
      });

      return NextResponse.redirect(`${back}?oauth=success&p=GOOGLE_CALENDAR`);
    }

    return NextResponse.redirect(`${back}?oauth=unknown_provider`);
  } catch (e) {
    console.error("[oauth/callback]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
