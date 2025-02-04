export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioLevelCallback: ((level: number) => void) | null = null;
  private streams: MediaStream[] = [];

  async startRecording(
    screenStream: MediaStream,
    microphoneStream: MediaStream | null,
    webcamStream: MediaStream | null,
    systemAudioStream: MediaStream | null
  ) {
    try {
      // Store streams for cleanup
      this.streams = [screenStream];
      if (microphoneStream) this.streams.push(microphoneStream);
      if (webcamStream) this.streams.push(webcamStream);
      if (systemAudioStream) this.streams.push(systemAudioStream);

      // Create an audio context for mixing audio streams if we have any audio
      let audioTracks: MediaStreamTrack[] = [];
      if (microphoneStream || systemAudioStream) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        // Add microphone audio
        if (microphoneStream) {
          const micSource =
            audioContext.createMediaStreamSource(microphoneStream);
          const micGain = audioContext.createGain();
          micGain.gain.value = 0.7; // Reduce microphone volume slightly
          micSource.connect(micGain).connect(destination);
        }

        // Add system audio
        if (systemAudioStream) {
          const sysSource =
            audioContext.createMediaStreamSource(systemAudioStream);
          sysSource.connect(destination);
        }

        audioTracks = destination.stream.getAudioTracks();
      }

      // Combine all tracks
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...audioTracks,
        ...(webcamStream?.getVideoTracks() || []),
      ];

      const combinedStream = new MediaStream(tracks);

      // Try different MIME types
      const mimeTypes = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
      ];

      let selectedMimeType = "";
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported MIME type found for recording");
      }

      // Create MediaRecorder with supported MIME type
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start(1000);
      return true;
    } catch (error) {
      this.cleanup();
      console.error("Error starting recording:", error);
      return false;
    }
  }

  pauseRecording() {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
      return true;
    }
    return false;
  }

  resumeRecording() {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
      return true;
    }
    return false;
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, { type: "video/webm" });
        this.recordedChunks = [];
        this.cleanupAudioAnalysis();
        resolve(finalBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  getRecordingDuration(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  private setupAudioAnalysis(
    audioStream: MediaStream,
    callback: (level: number) => void
  ) {
    this.audioContext = new AudioContext();
    this.audioAnalyser = this.audioContext.createAnalyser();
    this.audioAnalyser.fftSize = 256;

    const source = this.audioContext.createMediaStreamSource(audioStream);
    source.connect(this.audioAnalyser);

    this.audioLevelCallback = callback;
    this.analyzeAudio();
  }

  private analyzeAudio() {
    if (!this.audioAnalyser || !this.audioLevelCallback) return;

    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);

    const updateLevel = () => {
      this.audioAnalyser!.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = average / 255; // Normalize to 0-1
      this.audioLevelCallback!(level);

      if (this.mediaRecorder?.state === "recording") {
        requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  }

  private cleanupAudioAnalysis() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
      this.audioLevelCallback = null;
    }
  }

  cleanup() {
    // Stop all tracks in all streams
    this.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    this.streams = [];
    this.cleanupAudioAnalysis();
  }
}

export const recordingManager = new RecordingManager();
