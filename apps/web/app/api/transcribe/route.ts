import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { log } from "@/lib/logger";

const execFileAsync = promisify(execFile);

async function transcribeWithWhisper(buffer: Buffer): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const openai = new OpenAI({ apiKey });
    const file = await toFile(buffer, "audio.webm", { type: "audio/webm" });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    const text = transcription.text?.trim() ?? "";
    return text || null;
  } catch (e) {
    log("warn", "transcribe.whisper_failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

async function transcribeWithManus(tempFilePath: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync("manus-speech-to-text", [tempFilePath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stderr) {
      log("warn", "transcribe.manus_stderr", { stderr: String(stderr).slice(0, 500) });
    }
    const text = stdout.trim();
    if (!text && stderr) return null;
    return text || null;
  } catch (e) {
    log("warn", "transcribe.manus_failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

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

    const whisperText = await transcribeWithWhisper(buffer);
    if (whisperText) {
      return NextResponse.json({ text: whisperText, source: "whisper" });
    }

    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    await writeFile(tempFilePath, buffer);

    const manusText = await transcribeWithManus(tempFilePath);
    if (manusText) {
      return NextResponse.json({ text: manusText, source: "manus" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Transcription unavailable. Set OPENAI_API_KEY for Whisper, or install manus-speech-to-text on the server.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  } catch (e) {
    log("error", "transcribe.post_failed", {
      error: e instanceof Error ? e.message : String(e),
    });
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
