
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
    [AvatarStyle.PIXAR]: `
      Transform this person into a high-fidelity 3D animated character in the signature Disney/Pixar style. 
      - Use advanced subsurface scattering for skin textures.
      - Apply soft, cinematic global illumination.
      - Render expressive, slightly enlarged eyes that retain the original iris color and gaze.
      - Preserve distinct facial landmarks: nose shape, jawline, and unique features like glasses or facial hair.
      - The character should look friendly and 'alive' with a professional 3D render finish.`,
    
    [AvatarStyle.VECTOR]: `
      Create a premium 2D flat vector illustration avatar. 
      - Use clean, mathematically precise bezier curves.
      - Employ a sophisticated color palette with subtle gradients for depth.
      - Simplify features into iconic geometric shapes while maintaining a clear likeness.
      - Keep the background minimalist or a simple solid color circle.
      - Focus on clean line art and professional graphic design aesthetics.`,
    
    [AvatarStyle.ANIME]: `
      Convert this photo into a high-end anime portrait resembling a modern theatrical feature film (e.g., CoMix Wave Films).
      - Use crisp cell-shading combined with soft environmental glows.
      - Draw detailed, expressive eyes with multiple light reflections.
      - Maintain the original hairstyle and clothing colors accurately.
      - The lines should be fine and clean, with a focus on aesthetic 'Bishounen' or 'Bishoujo' proportions while staying true to the person's identity.`,
    
    [AvatarStyle.SKETCH]: `
      Create a masterful artistic hand-drawn graphite and charcoal sketch.
      - Use realistic cross-hatching and blending for shadows.
      - Emphasize the texture of the paper and the varying weight of the pencil strokes.
      - Focus heavily on capturing the 'soul' and anatomy of the face for a high degree of recognition.
      - The style should look like a professional courtroom sketch or a high-end street artist's portrait.`,
    
    [AvatarStyle.COMIC]: `
      Transform this image into a dynamic Silver Age comic book hero.
      - Use bold, varied-weight ink lines (Inking style).
      - Apply classic Ben-Day dots or halftone patterns for shading.
      - Emphasize heroic lighting and dramatic shadows (Chiaroscuro).
      - Preserve the person's facial structure but stylized with the characteristic "rugged" or "heroic" aesthetic of classic Marvel/DC artists.`,

    [AvatarStyle.CYBERPUNK]: `
      Transform this image into a gritty, futuristic Cyberpunk character.
      - Use a high-contrast palette dominated by neon cyan, magenta, and electric purple.
      - Incorporate subtle cybernetic enhancements or glowing technological patterns on the skin.
      - Set the scene with cinematic night lighting and rain-slicked reflections.
      - Maintain facial likeness while adding a futuristic 'tech-wear' aesthetic to the character's appearance.`,

    [AvatarStyle.GOTHIC]: `
      Transform this person into a dark, elegant Gothic Fantasy character.
      - Use a moody, desaturated color palette with deep blacks, crimsons, and silvers.
      - Apply dramatic, high-contrast shadows and Victorian-inspired clothing details (like lace or high collars).
      - Give the skin a porcelain-like quality with a mysterious, ethereal atmosphere.
      - Preserve the original facial features while evoking a sense of dark romanticism.`,

    [AvatarStyle.CLAY]: `
      Create a charming stop-motion claymation character based on this photo.
      - Apply a tactile, handmade clay texture with visible fingerprints and slight surface imperfections.
      - Use a vibrant, matte color palette and soft, warm studio lighting.
      - Give the character physical-looking eyes and hair that appear sculpted from real modeling clay.
      - Maintain a strong facial likeness but simplify it into the cute, round proportions characteristic of clay animation films like Wallace & Gromit.`
  };

  const systemInstruction = `
    You are a world-class digital portrait artist specializing in character likeness. 
    Your absolute priority is to maintain the person's facial identity, proportions, and unique characteristics (like glasses, hair style, and expression) while perfectly executing the requested artistic style. 
    The output must be a single, centered, high-quality head-and-shoulders portrait.
  `;

  const prompt = `${stylePrompts[style]} 
    Crucial: The avatar MUST look exactly like the person in the provided image. Do not generate a generic character; generate a stylized version of THIS specific individual.`;

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
      config: {
        systemInstruction: systemInstruction,
      }
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
