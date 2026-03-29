"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const NDA_COOKIE = "busos_nda_accepted";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function NdaGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mounted, setMounted] = useState(false);
  const [declined, setDeclined] = useState(false);

  const accept = useCallback(() => {
    document.cookie = `${NDA_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NDA_COOKIE, String(Date.now()));
    }
    router.push(next);
    router.refresh();
  }, [router, next]);

  const decline = useCallback(() => {
    setDeclined(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-8">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Access not granted</h1>
          <p className="mt-3 text-muted-foreground">
            You must accept the Confidentiality and Non-Disclosure terms to access BUSOS. Your
            access has not been recorded.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            If you change your mind, you may refresh this page to review and accept the terms.
          </p>
          <button
            type="button"
            onClick={() => setDeclined(false)}
            className="mt-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
          >
            Back to terms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">Confidentiality & Non-Disclosure</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You must accept the terms below before accessing BUSOS.
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-foreground">
            <p className="mb-4 font-medium text-foreground">
              This website and the product it describes are confidential and are disclosed solely
              for the purpose of evaluating or using BUSOS under the following terms.
            </p>

            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong>Confidential Information.</strong> You acknowledge that all information
                you receive or observe through this site (including software, interfaces, features,
                business methods, and any related materials) (&quot;Confidential Information&quot;) is
                proprietary and confidential. Confidential Information is disclosed to you solely in
                connection with your evaluation or use of BUSOS.
              </li>
              <li>
                <strong>Non-Disclosure.</strong> You agree not to disclose, publish, or disseminate
                any Confidential Information to any third party without prior written consent. You
                will use Confidential Information only for the purpose of evaluating or using BUSOS
                and will protect it with at least the same care you use for your own confidential
                information.
              </li>
              <li>
                <strong>Intellectual Property & Patent Rights.</strong> All rights in the Confidential
                Information, including patent, copyright, trademark, and trade secret rights, remain
                with the owner. Your access does not grant you any license except to view and use
                the site as intended. Disclosure of Confidential Information without this agreement
                could impair the owner&apos;s ability to obtain or enforce patent and other intellectual
                property rights. You agree not to take any action that would jeopardize those
                rights.
              </li>
              <li>
                <strong>No License.</strong> No license or right is granted to you except the limited
                right to access and use the site in accordance with these terms. You may not copy,
                modify, reverse engineer, or create derivative works from the Confidential
                Information.
              </li>
              <li>
                <strong>Return of Information.</strong> Upon request, you will cease use of and not
                retain any Confidential Information. Your obligations under this agreement survive
                termination of your access.
              </li>
              <li>
                <strong>Governing Law.</strong> This agreement is governed by the laws of the
                United States and the State of Delaware, without regard to conflict of laws
                principles. Any dispute shall be resolved in the courts of that jurisdiction.
              </li>
            </ol>

            <p className="mt-4 text-muted-foreground">
              By clicking &quot;I Accept&quot; you confirm that you have read, understood, and agree to be
              bound by these terms. If you do not agree, click &quot;I Do Not Accept&quot; and you will not
              be granted access.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={decline}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-background"
            >
              I Do Not Accept
            </button>
            <button
              type="button"
              onClick={accept}
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground"
            >
              I Accept
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Acceptance is recorded in your browser. Do not accept on behalf of others without
          authority.
        </p>
      </div>
    </div>
  );
}

export default function NdaGatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    }>
      <NdaGateContent />
    </Suspense>
  );
}
