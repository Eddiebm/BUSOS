export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEARN_ARTICLES_SEED } from "@/lib/learn-articles-data";

async function ensureSeeded() {
  const n = await prisma.article.count();
  if (n > 0) return;
  await prisma.article.createMany({
    data: LEARN_ARTICLES_SEED.map((a) => ({
      title: a.title,
      slug: a.slug,
      category: a.category,
      content: a.content,
    })),
  });
}

export async function GET(request: Request) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureSeeded();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    const category = searchParams.get("category")?.trim();

    const rows = await prisma.article.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("[articles/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
