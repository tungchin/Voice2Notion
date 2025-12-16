import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResult, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a Blob to a Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; // Remove metadata prefix
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Sends audio to Gemini for transcription and categorization.
 */
export const processAudioNote = async (audioBlob: Blob): Promise<ProcessingResult> => {
  const base64Audio = await blobToBase64(audioBlob);

  const prompt = `
    Listen to the attached audio carefully. 
    
    1. **Transcription (Content)**:
       - Transcribe the speech verbatim in the original language.
       - Then, append a section for "Colloquial English":
         - If the audio is in Chinese, translate it into natural, colloquial English.
         - If the audio is in English, polish it into fluent, colloquial English.
       - The 'transcription' field must contain BOTH the original text and the English version, separated by two newlines.

    2. **Title (Summary)**:
       - Generate a title that includes BOTH Chinese and English descriptions, separated by " | ".
       - Example: "專案會議記錄 | Project Meeting Minutes".

    3. **Categorization**:
       - Analyze the content and categorize it into one of these categories: "Work", "Personal", "Ideas", "To-Do", "Other".

    4. **Tags**:
       - Extract up to 5 relevant keyword tags.
    
    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type, // e.g., 'audio/webm' or 'audio/mp4'
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(Category) },
            summary: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["transcription", "category", "summary", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from Gemini");
    }
    
    return JSON.parse(text) as ProcessingResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process audio. Please try again.");
  }
};