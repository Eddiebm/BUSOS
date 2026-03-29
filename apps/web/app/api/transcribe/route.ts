import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  let tempFilePath: string | null = null;
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    await writeFile(tempFilePath, buffer);

    const { stdout, stderr } = await execFileAsync("manus-speech-to-text", [tempFilePath], {
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      console.error(`[transcribe] stderr: ${stderr}`);
    }

    const text = stdout.trim();
    if (!text && stderr) {
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("[transcribe/POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  } finally {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        /* ignore */
      }
    }
  }
}
