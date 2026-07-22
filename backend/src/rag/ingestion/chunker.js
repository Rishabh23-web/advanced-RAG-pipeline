/**
 * Chunks an array of subtitle cues using a time-aware sliding window with overlap.
 * 
 * @param {Array} cues - Array of cue objects { start, end, text }
 * @param {string} courseId - The course identifier
 * @param {string} lessonName - The lesson name
 * @param {number} windowSizeSec - Target duration for each chunk (e.g., 60 seconds)
 * @param {number} overlapSec - Target overlap duration (e.g., 15 seconds)
 * @returns {Array} Array of chunk objects with text and metadata
 */
export function timeAwareChunker(cues, courseId, lessonName, windowSizeSec = 60, overlapSec = 15) {
  const chunks = [];
  
  if (!cues || cues.length === 0) return chunks;

  let currentChunkCues = [];
  let chunkStartTime = cues[0].start;
  
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    currentChunkCues.push(cue);
    
    // Check if the current chunk exceeds the window size
    if (cue.end - chunkStartTime >= windowSizeSec) {
      // Finalize the current chunk
      chunks.push(createChunkObject(currentChunkCues, courseId, lessonName));
      
      // Start a new chunk with overlapping cues
      // We look back to find cues that fall within the overlap period (overlapSec before the current cue.end)
      const overlapStartTime = cue.end - overlapSec;
      
      // Keep only the cues from currentChunkCues that overlap
      currentChunkCues = currentChunkCues.filter(c => c.end > overlapStartTime);
      
      // Ensure we don't end up with an empty chunk if no cues overlap, just start from current
      if (currentChunkCues.length === 0) {
        currentChunkCues = [cue];
      }
      
      chunkStartTime = currentChunkCues[0].start;
    }
  }

  // Push the final chunk if it has any remaining cues
  if (currentChunkCues.length > 0) {
    chunks.push(createChunkObject(currentChunkCues, courseId, lessonName));
  }

  return chunks;
}

/**
 * Helper to combine cues into a single text block and attach metadata.
 */
function createChunkObject(cues, courseId, lessonName) {
  const combinedText = cues.map(c => c.text).join(' ');
  const startTime = cues[0].start;
  const endTime = cues[cues.length - 1].end;
  
  return {
    text: combinedText,
    metadata: {
      course_id: courseId,
      lesson_name: lessonName,
      start_time: formatTime(startTime),
      end_time: formatTime(endTime),
      start_seconds: startTime,
      end_seconds: endTime
    }
  };
}

/**
 * Format seconds into HH:MM:SS string
 */
function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}
