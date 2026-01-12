
import { GoogleGenAI } from "@google/genai";
import { AvatarStyle } from "../types";

export const generateAvatar = async (
  base64Image: string,
  style: AvatarStyle
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract base64 data without the prefix
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  const stylePrompts = {
    [AvatarStyle.PIXAR]: "Transform this person into a high-quality 3D animated character in Pixar style. Keep the face shape, glasses, plaid cap, purple shirt, and black jacket consistent with the original image. Ensure smooth skin, expressive eyes, and vibrant lighting.",
    [AvatarStyle.VECTOR]: "Create a clean 2D vector flat illustration avatar. Maintain the distinct features like the glasses, the checkered hat, and the clothing. Use bold lines and a modern color palette.",
    [AvatarStyle.ANIME]: "Convert this photo into a detailed anime portrait style (Kyoto Animation or Makoto Shinkai style). Keep the hat's pattern and the person's glasses. Soft lighting and expressive features.",
    [AvatarStyle.SKETCH]: "Generate a realistic artistic hand-drawn pencil sketch avatar. Focus on the facial details, the glasses, and the texture of the hat and jacket.",
    [AvatarStyle.COMIC]: "Turn this image into a Marvel/DC style comic book hero avatar. Use dramatic ink lines and dot shading. Keep the signature plaid cap and dark clothing."
  };

  const prompt = `Act as a world-class digital artist. ${stylePrompts[style]} The likeness to the person in the provided image must be extremely high.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let imageUrl = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("The model did not return an image part in the response.");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate avatar. Please try again.");
  }
};
