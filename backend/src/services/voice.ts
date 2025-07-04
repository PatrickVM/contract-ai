import axios from "axios";
import {
  TranscriptionRequest,
  TranscriptionResponse,
  TTSRequest,
  TTSResponse,
} from "../types";

export class VoiceService {
  static async transcribeAudio(
    request: TranscriptionRequest
  ): Promise<TranscriptionResponse> {
    try {
      // Try OpenAI Whisper API first
      if (process.env.OPENAI_API_KEY) {
        return await this.transcribeWithOpenAI(request.audioUrl);
      }

      // Fallback to self-hosted Whisper
      return await this.transcribeWithWhisper(request.audioUrl, request.model);
    } catch (error) {
      console.error("Transcription Error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  static async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Use Coqui TTS
      return await this.generateWithCoqui(request.text, request.voice);
    } catch (error) {
      console.error("TTS Error:", error);
      throw new Error("Failed to generate speech");
    }
  }

  private static async transcribeWithOpenAI(
    audioUrl: string
  ): Promise<TranscriptionResponse> {
    const openai = require("openai");
    const client = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Download audio file
    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
    });
    const audioBuffer = Buffer.from(audioResponse.data);

    const transcription = await client.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      confidence: 0.9, // OpenAI doesn't provide confidence scores
    };
  }

  private static async transcribeWithWhisper(
    audioUrl: string,
    model: string = "base"
  ): Promise<TranscriptionResponse> {
    const whisperUrl =
      process.env.WHISPER_API_URL || "http://localhost:9000/asr";

    const response = await axios.post(whisperUrl, {
      audio_url: audioUrl,
      model: model,
    });

    return {
      text: response.data.text,
      confidence: response.data.confidence || 0.8,
    };
  }

  private static async generateWithCoqui(
    text: string,
    voice: string = "en_0"
  ): Promise<TTSResponse> {
    const coquiUrl =
      process.env.COQUI_TTS_URL || "http://localhost:5002/api/tts";

    const response = await axios.post(
      coquiUrl,
      {
        text: text,
        voice: voice,
      },
      {
        responseType: "arraybuffer",
      }
    );

    // In a real implementation, you'd save this to a file and return the URL
    // For now, we'll return a mock URL
    const audioUrl = `data:audio/wav;base64,${Buffer.from(
      response.data
    ).toString("base64")}`;

    return {
      audioUrl: audioUrl,
      duration: this.estimateDuration(text),
    };
  }

  private static estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute
    const words = text.split(" ").length;
    return Math.ceil((words / 150) * 60);
  }

  static async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(audioUrl, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error("Audio Download Error:", error);
      throw new Error("Failed to download audio file");
    }
  }

  static async saveAudioToFile(
    audioBuffer: Buffer,
    filename: string
  ): Promise<string> {
    // In production, you'd save to cloud storage (S3, etc.)
    // For now, we'll return a mock file path
    const filePath = `/tmp/${filename}`;

    // Mock file save - in real implementation, use fs.writeFileSync
    console.log(`Mock saving audio to: ${filePath}`);

    return filePath;
  }
}
