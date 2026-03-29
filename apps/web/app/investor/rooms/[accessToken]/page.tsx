import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ accessToken: string }>;
  searchParams: Promise<{ password?: string }>;
}

export default async function DataRoomPage({ params, searchParams }: PageProps) {
  const { accessToken } = await params;
  const { password } = await searchParams;

  const dataRoom = await prisma.dataRoom.findUnique({
    where: { accessToken, isActive: true },
    include: {
      venture: { select: { name: true } },
      documents: {
        include: { document: { select: { id: true, title: true, fileUrl: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!dataRoom) notFound();
  if (dataRoom.password != null && dataRoom.password !== "" && dataRoom.password !== password) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-destructive">Invalid or missing password for this data room.</p>
      </div>
    );
  }

  const ventureName = dataRoom.venture.name;
  const documents = dataRoom.documents.map((d) => ({
    id: d.document.id,
    title: d.document.title,
    url: d.document.fileUrl,
  }));

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Data room: {ventureName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Documents shared with you. Do not distribute.
        </p>
        <ul className="mt-6 space-y-3">
          {documents.length === 0 && (
            <li className="text-muted-foreground">No documents in this room yet.</li>
          )}
          {documents.map((d) => (
            <li key={d.id} className="rounded-lg border border-border bg-card p-4">
              <span className="font-medium">{d.title}</span>
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-info underline"
                >
                  Open
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-muted-foreground">
          <Link href="/">BUSOS</Link> — Confidential.
        </p>
      </div>
    </div>
  );
}
