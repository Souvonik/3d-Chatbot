import { LipSyncAnalyzeResult } from "./lipSyncAnalyzeResult";

const TIME_DOMAIN_DATA_LENGTH = 2048;

export class LipSync {
  public readonly audio: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly timeDomainData: Float32Array;

  public constructor(audio: AudioContext) {
    this.audio = audio;

    this.analyser = audio.createAnalyser();
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH);
  }

  public update(): LipSyncAnalyzeResult {
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    let volume = 0.0;
    let rms = 0.0;
    
    // Calculate both peak and RMS for better volume detection
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      const sample = this.timeDomainData[i];
      volume = Math.max(volume, Math.abs(sample));
      rms += sample * sample;
    }
    
    rms = Math.sqrt(rms / TIME_DOMAIN_DATA_LENGTH);
    
    // Use a combination of peak and RMS for more responsive detection
    const combinedVolume = (volume * 0.7 + rms * 0.3);
    
    // Improved sigmoid function for smoother transitions
    const smoothedVolume = 1 / (1 + Math.exp(-35 * combinedVolume + 4));
    
    // Dynamic threshold based on recent audio levels
    const threshold = 0.08;
    const finalVolume = smoothedVolume < threshold ? 0 : smoothedVolume;

    return {
      volume: finalVolume,
    };
  }

  public async playFromArrayBuffer(buffer: ArrayBuffer, onEnded?: () => void) {
    try {
      console.log('LipSync: Starting audio playback, buffer size:', buffer.byteLength);
      
      // Resume audio context if it's suspended
      if (this.audio.state === 'suspended') {
        console.log('LipSync: Resuming audio context');
        await this.audio.resume();
      }
      
      const audioBuffer = await this.audio.decodeAudioData(buffer);
      console.log('LipSync: Audio buffer decoded successfully');

      const bufferSource = this.audio.createBufferSource();
      bufferSource.buffer = audioBuffer;

      bufferSource.connect(this.audio.destination);
      bufferSource.connect(this.analyser);
      
      console.log('LipSync: Starting audio playback');
      bufferSource.start();
      
      if (onEnded) {
        bufferSource.addEventListener("ended", () => {
          console.log('LipSync: Audio playback ended');
          onEnded();
        });
      }
    } catch (error) {
      console.error('LipSync: Error during audio playback:', error);
      if (onEnded) onEnded();
    }
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    this.playFromArrayBuffer(buffer, onEnded);
  }
}
