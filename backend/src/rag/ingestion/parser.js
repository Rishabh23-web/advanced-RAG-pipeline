import fs from 'fs';
import { parse as parseVttRaw } from 'node-webvtt';
import parser from 'subtitles-parser';
import path from 'path';

/**
 * Parses a VTT or SRT file and returns an array of subtitle cues.
 * @param {string} filePath - Path to the subtitle file.
 * @returns {Array} Array of cues { start, end, text } in seconds.
 */
export function parseSubtitle(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    if (ext === '.vtt') {
      const parsed = parseVttRaw(content, { strict: false });
      return parsed.cues.map(cue => ({
        start: cue.start,
        end: cue.end,
        text: cue.text.replace(/<[^>]+>/g, '').trim()
      }));
    } else if (ext === '.srt') {
      const parsed = parser.fromSrt(content, true); // true = use ms
      return parsed.map(cue => ({
        start: cue.startTime / 1000,
        end: cue.endTime / 1000,
        text: cue.text.replace(/<[^>]+>/g, '').trim()
      }));
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  } catch (error) {
    console.error(`Failed to parse subtitle file at ${filePath}:`, error);
    throw error;
  }
}
