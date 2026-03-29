import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import {
  mergeBlocks,
  normalizeBlocks,
  normalizePartialPatch,
  seedBlocksFromVenture,
} from "@/lib/lean-canvas";
import { prisma } from "@/lib/prisma";

async function ensureVentureOwner(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
    include: { dna: true, leanCanvas: true },
  });
  if (!v) throw new Error("NOT_FOUND");
  return v;
}

/**
 * GET — Current Lean Canvas: persisted row if any, else VentureDNA-backed seed (not saved until PATCH).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await ensureVentureOwner(ventureId, userId);
    const seed = seedBlocksFromVenture(venture, venture.dna);

    if (!venture.leanCanvas) {
      return NextResponse.json({
        blocks: seed,
        persisted: false,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      blocks: normalizeBlocks(venture.leanCanvas.blocks),
      persisted: true,
      updatedAt: venture.leanCanvas.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[lean-canvas/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH — Upsert canvas blocks (partial merge). First save creates the row.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await ensureVentureOwner(ventureId, userId);
    const body = (await request.json()) as { blocks?: unknown };
    const patch = normalizePartialPatch(body.blocks);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid block fields in body.blocks" }, { status: 400 });
    }

    const seed = seedBlocksFromVenture(venture, venture.dna);
    const previous = venture.leanCanvas
      ? normalizeBlocks(venture.leanCanvas.blocks)
      : seed;
    const merged = mergeBlocks(previous, patch);

    const saved = await prisma.leanCanvas.upsert({
      where: { ventureId },
      create: {
        ventureId,
        blocks: merged as unknown as Prisma.InputJsonValue,
      },
      update: {
        blocks: merged as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      blocks: merged,
      persisted: true,
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[lean-canvas/PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST — Replace canvas with a fresh seed from Venture + DNA (explicit reset / sync from intake).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "reseed") {
      return NextResponse.json({ error: 'Expected { "action": "reseed" }' }, { status: 400 });
    }

    const { ventureId } = await params;
    const venture = await ensureVentureOwner(ventureId, userId);
    const seed = seedBlocksFromVenture(venture, venture.dna);

    const saved = await prisma.leanCanvas.upsert({
      where: { ventureId },
      create: {
        ventureId,
        blocks: seed as unknown as Prisma.InputJsonValue,
      },
      update: {
        blocks: seed as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      blocks: seed,
      persisted: true,
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[lean-canvas/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
