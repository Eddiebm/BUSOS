import { NextResponse } from "next/server";

/**
 * This route initializes the Clerk dev browser token for non-localhost deployments.
 * Clerk's development instance requires a __clerk_db_jwt cookie which is normally
 * only set on localhost. This route fetches it from Clerk's FAPI and sets it.
 */
export async function GET(request: Request) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  
  // Extract the FAPI domain from the publishable key
  // pk_test_BASE64 -> decode -> "domain$"
  const keyPart = publishableKey.replace("pk_test_", "").replace("pk_live_", "");
  let fapiDomain = "";
  try {
    fapiDomain = atob(keyPart).replace(/\$$/, "");
  } catch {
    return NextResponse.json({ error: "Invalid publishable key" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirect_url") ?? "/";

  // Fetch dev browser token from Clerk FAPI
  try {
    const fapiUrl = `https://${fapiDomain}/v1/dev_browser`;
    const resp = await fetch(fapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!resp.ok) {
      const text = await resp.text();
      console.error("[clerk-dev-init] FAPI error:", resp.status, text);
      return NextResponse.json({ error: "Failed to init dev browser", detail: text }, { status: 500 });
    }
    
    const data = await resp.json();
    const token = data?.token;
    
    if (!token) {
      return NextResponse.json({ error: "No token returned", data }, { status: 500 });
    }

    // Redirect to the target URL with the token as a query param
    // Clerk's JS will pick it up and set the cookie
    const targetUrl = new URL(redirectUrl, request.url);
    targetUrl.searchParams.set("__clerk_db_jwt", token);
    targetUrl.searchParams.set("__clerk_status", "devBrowserDebug");
    
    return NextResponse.redirect(targetUrl.toString());
  } catch (err) {
    console.error("[clerk-dev-init] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
