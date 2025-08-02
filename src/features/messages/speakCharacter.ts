import { wait } from "@/utils/wait";
import { synthesizeVoice } from "../elevenlabs/elevenlabs";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";
import { Talk } from "./messages";
import { ElevenLabsParam } from "../constants/elevenLabsParam";

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    elevenLabsKey: string,
    elevenLabsParam: ElevenLabsParam,
    viewer: Viewer,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    console.log('speakCharacter: Called with screenplay:', screenplay);
    console.log('speakCharacter: ElevenLabs key:', elevenLabsKey ? 'Set' : 'Not set');
    
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime));
      }

      // if elevenLabsKey is not set, do not fetch audio
      if (!elevenLabsKey || elevenLabsKey.trim() == "") {
        console.log("speakCharacter: elevenLabsKey is not set");
        return null;
      }

      console.log('speakCharacter: Fetching audio...');
      const buffer = await fetchAudio(screenplay.talk, elevenLabsKey, elevenLabsParam).catch((error) => {
        console.error('speakCharacter: Error fetching audio:', error);
        return null;
      });
      lastTime = Date.now();
      console.log('speakCharacter: Audio fetched, buffer size:', buffer?.byteLength || 0);
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(([audioBuffer]) => {
      console.log('speakCharacter: Starting speech with buffer size:', audioBuffer?.byteLength || 0);
      onStart?.();
      if (!audioBuffer) {
        console.log('speakCharacter: No audio buffer, speaking without audio');
        // pass along screenplay to change avatar expression
        return viewer.model?.speak(null, screenplay);
      }
      return viewer.model?.speak(audioBuffer, screenplay);
    });
    prevSpeakPromise.then(() => {
      console.log('speakCharacter: Speech completed');
      onComplete?.();
    });
  };
}

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk, 
  elevenLabsKey: string,
  elevenLabsParam: ElevenLabsParam,
  ): Promise<ArrayBuffer> => {
  console.log('fetchAudio: Starting TTS request for message:', talk.message);
  
  const ttsVoice = await synthesizeVoice(
    talk.message,
    talk.speakerX,
    talk.speakerY,
    talk.style,
    elevenLabsKey,
    elevenLabsParam
  );
  const dataUrl = ttsVoice.audio;

  if (dataUrl == null) {
    throw new Error("Something went wrong");
  }

  console.log('fetchAudio: TTS response received, data URL length:', dataUrl.length);

  // Handle data URL format: data:audio/mpeg;base64,<base64data>
  if (dataUrl.startsWith('data:audio/mpeg;base64,')) {
    const base64Data = dataUrl.split(',')[1];
    console.log('fetchAudio: Processing base64 data, length:', base64Data.length);
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('fetchAudio: Converted to ArrayBuffer, size:', bytes.buffer.byteLength);
    return bytes.buffer;
  }

  // Fallback to fetch if it's a regular URL
  console.log('fetchAudio: Using fallback fetch for URL');
  const resAudio = await fetch(dataUrl);
  const buffer = await resAudio.arrayBuffer();
  return buffer;
};
