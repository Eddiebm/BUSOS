import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEARN_ARTICLES_SEED } from "@/lib/learn-articles-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    if ((await prisma.article.count()) === 0) {
      await prisma.article.createMany({
        data: LEARN_ARTICLES_SEED.map((a) => ({
          title: a.title,
          slug: a.slug,
          category: a.category,
          content: a.content,
        })),
      });
    }

    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (e) {
    console.error("[article/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
