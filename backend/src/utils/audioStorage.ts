import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(__dirname, "../../../static/audio/uploads");

/**
 * Saves an audio buffer as a WAV file on disk under user-specific subdirectories.
 * Creates directories if they do not exist.
 * Returns the relative static URL for accessing the file.
 */
export function saveAudioFile(userId: string, questionId: string, audioBuffer: Buffer): string {
  const userDir = path.join(UPLOADS_DIR, userId);

  // Ensure directories exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `${questionId}_${timestamp}.wav`;
  const filePath = path.join(userDir, filename);

  // Write file
  fs.writeFileSync(filePath, audioBuffer);

  // Return static relative URL
  return `/static/audio/uploads/${userId}/${filename}`;
}
