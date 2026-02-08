
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeWasteFrame = async (base64Image: string): Promise<AnalysisResponse> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an AI-based computer vision system for an automated waste segregation conveyor belt.
    Analyze the image frame and detect all visible waste objects.
    
    For each object, determine:
    1. Name (e.g., plastic bottle, banana peel, crushed can).
    2. Dominant color.
    3. Waste Type (Plastic, Organic, Cloth/Textile, Metal, Paper/Cardboard, Glass, Other / Non-recyclable).
    4. Target IoT Bin (Plastic Bin, Organic Bin, Cloth/Textile Bin, Metal Bin, Paper Bin, Glass Bin, General Waste Bin).
    5. Bounding box [ymin, xmin, ymax, xmax] normalized to 1000x1000.
    
    Return the response in a structured JSON format matching the schema provided.
    Ensure "sortingAction" describes the specific movement (robotic arm or air jet) for the objects found.
    Evaluate the overall system operating state.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      detectedObjects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            color: { type: Type.STRING },
            wasteType: { type: Type.STRING },
            targetBin: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            box2d: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER }
            }
          },
          required: ["name", "color", "wasteType", "targetBin", "box2d"]
        }
      },
      sortingAction: { type: Type.STRING },
      systemStatus: {
        type: Type.OBJECT,
        properties: {
          processedCount: { type: Type.NUMBER },
          operatingState: { type: Type.STRING }
        },
        required: ["processedCount", "operatingState"]
      }
    },
    required: ["detectedObjects", "sortingAction", "systemStatus"]
  };

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: "Analyze this conveyor belt frame for waste segregation." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
