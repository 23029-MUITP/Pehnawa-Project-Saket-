import { GoogleGenAI } from "@google/genai";
import { PehanawaConfig, DesignerRecommendation, GenerationResultWithRecommendations } from "../types";

const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Parse designer recommendations from the text response
 */
function parseDesignerRecommendations(text: string): DesignerRecommendation | undefined {
  try {
    // Look for JSON block in the response
    const jsonMatch = text.match(/\{[\s\S]*"lookName"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        lookName: parsed.lookName || "Curated Look",
        pairWith: parsed.pairWith || [],
        stylingTip: parsed.stylingTip || "",
        occasions: parsed.occasions || []
      };
    }

    // Fallback: try to extract from structured text
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      return {
        lookName: "Designer's Choice",
        pairWith: lines.slice(0, 3).map(l => l.replace(/^[-•*]\s*/, '').trim()),
        stylingTip: lines.length > 3 ? lines[3] : "Let the fabric speak for itself.",
        occasions: ["Formal Events", "Special Occasions"]
      };
    }
  } catch (e) {
    console.warn("Could not parse designer recommendations:", e);
  }
  return undefined;
}

export const generatePehanawaOutfit = async (config: PehanawaConfig): Promise<GenerationResultWithRecommendations> => {
  const ai = getAIClient();

  if (!config.clothImage || !config.customerImage) {
    throw new Error("Missing required images (Cloth or Customer)");
  }

  const clothBase64 = await fileToGenerativePart(config.clothImage);
  const customerBase64 = await fileToGenerativePart(config.customerImage);

  const parts: any[] = [];

  // Base Inputs
  // Image A = Customer
  // Image B = Fabric/Cloth
  parts.push({ inlineData: { mimeType: config.customerImage.type, data: customerBase64 } });
  parts.push({ inlineData: { mimeType: config.clothImage.type, data: clothBase64 } });

  let prompt = `
    You are TWO experts in one:
    1. A MASTER AI STYLIST who creates photorealistic outfit visualizations.
    2. A CELEBRITY FASHION DESIGNER (like Manish Malhotra) who provides expert styling recommendations.

    YOUR DUAL TASK:
    A) Generate a stunning outfit image (MOST IMPORTANT)
    B) Provide brief styling recommendations as JSON text AFTER the image

    Reference Images:
    1. IMAGE A (Customer): The person.
    2. IMAGE B (Fabric/Material): The source cloth.
  `;

  // --- SUIT LOGIC ---
  if (config.category === 'SUIT') {
    prompt += `
    Configuration: SUIT.
    Style: ${config.pieceCount}-Piece Suit.
    
    Instructions for IMAGE:
    - Generate a ${config.pieceCount}-piece suit on the Customer (Image A).
    - Construct the suit using the FABRIC and TEXTURE from Image B.
    - 1-Piece = Jacket/Blazer only.
    - 2-Piece = Jacket + Trousers.
    - 3-Piece = Jacket + Waistcoat + Trousers.
    `;

    if (config.shirtOption === 'custom-image' && config.shirtImage) {
      const shirtBase64 = await fileToGenerativePart(config.shirtImage);
      prompt += `\n3. IMAGE C (Shirt): wear this specific shirt under the suit.`;
      parts.push({ inlineData: { mimeType: config.shirtImage.type, data: shirtBase64 } });
    } else if (config.shirtOption === 'white') {
      prompt += `\n- Wear a clean white formal shirt inside.`;
    } else if (config.shirtOption === 'black') {
      prompt += `\n- Wear a black formal shirt inside.`;
    }
  }

  // --- ETHNIC LOGIC ---
  else if (config.category === 'ETHNIC') {
    prompt += `Configuration: INDIAN ETHNIC WEAR.\n`;

    if (config.ethnicType === 'custom' && config.styleReferenceImage) {
      const styleRefBase64 = await fileToGenerativePart(config.styleReferenceImage);
      prompt += `\n3. IMAGE C (Style Reference): The design/cut to copy.`;
      parts.push({ inlineData: { mimeType: config.styleReferenceImage.type, data: styleRefBase64 } });

      prompt += `
      Instructions for IMAGE:
      - Create an outfit for the Customer (Image A).
      - COPY the silhouette, cut, and style from Image C (Style Reference).
      - USE the FABRIC and PATTERN from Image B to make that outfit.
      `;
    } else {
      const typeName = config.ethnicType?.replace('-', ' ').toUpperCase() || 'ETHNIC OUTFIT';
      prompt += `Type: ${typeName}.\nInstructions:\n- Generate a traditional ${typeName} using Fabric B on Customer A.`;
    }
  }

  // --- SHIRTING LOGIC ---
  else if (config.category === 'SHIRTING') {
    prompt += `
    Configuration: SHIRT.
    
    Instructions for IMAGE:
    - Analyze the Fabric in Image B. Determine if it is formal, casual, printed, or solid.
    - Generate a shirt on Customer A that perfectly matches the style of the fabric.
    - If the fabric is plaid/checked -> Casual button down.
    - If the fabric is fine cotton/solid -> Formal dress shirt.
    - Ensure perfect fit and lighting.
    `;
  }

  // --- PANTS LOGIC ---
  else if (config.category === 'PANTS') {
    prompt += `
    Configuration: TROUSERS / PANTS.
    
    Instructions for IMAGE:
    - Analyze the Fabric in Image B.
    - Generate trousers/pants on Customer A using Fabric B.
    - Match the cut to the fabric weight (e.g., if denim -> jeans, if wool -> dress pants, if cotton -> chinos).
    - Keep the customer's existing upper body clothing if possible, or replace with a neutral t-shirt/shirt to focus on the pants.
    `;
  }

  // --- OTHERS LOGIC ---
  else if (config.category === 'OTHERS') {
    prompt += `Configuration: CUSTOM REQUEST.\n`;

    if (config.styleReferenceImage) {
      const styleRefBase64 = await fileToGenerativePart(config.styleReferenceImage);
      prompt += `\n3. IMAGE C (Style Reference): The design to copy.`;
      parts.push({ inlineData: { mimeType: config.styleReferenceImage.type, data: styleRefBase64 } });

      prompt += `
      Instructions for IMAGE:
      - Create an outfit for Customer A.
      - EXACTLY COPY the design and style from Image C.
      - RENDER it using the Fabric from Image B.
      `;
    } else if (config.customPrompt) {
      prompt += `
      Style Description: "${config.customPrompt}"
      
      Instructions for IMAGE:
      - Create an outfit for Customer A based on the "Style Description" above.
      - USE the Fabric from Image B.
      - Be creative but realistic.
      `;
    }
  }

  prompt += `
    General Rules for IMAGE:
    - PRESERVE Customer's (Image A) face and body exactly.
    - High realism, photorealistic texture rendering of Image B.

    AFTER generating the image, provide styling recommendations as a JSON object:
    {
      "lookName": "Creative name for this look (e.g., 'Midnight Admiral', 'Royal Heritage')",
      "pairWith": ["3 specific accessory/item suggestions to complete the look"],
      "stylingTip": "One expert styling tip from a designer's perspective",
      "occasions": ["2-3 suitable occasions for this outfit"]
    }

    IMPORTANT: Generate the IMAGE FIRST, then add the JSON recommendations as text.
  `;

  // Prepend text prompt
  parts.unshift({ text: prompt });

  try {
    // Use gemini-2.5-flash with image generation for best quality virtual try-on
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: parts }],
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    const candidates = response.candidates;
    let imageData: string | null = null;
    let textData: string = "";

    if (candidates && candidates.length > 0) {
      const responseParts = candidates[0].content?.parts || [];

      // Extract both image and text from response
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textData += part.text;
        }
      }
    }

    if (!imageData) {
      if (textData) {
        throw new Error(`Model returned text instead of image: ${textData.substring(0, 100)}...`);
      }
      throw new Error("Generation failed - no image returned.");
    }

    // Parse recommendations from text response
    const recommendations = parseDesignerRecommendations(textData);

    return {
      image: imageData,
      recommendations: recommendations
    };

  } catch (error: any) {
    console.error("Pehanawa generation error:", error);
    throw new Error(error.message || "Failed to generate outfit.");
  }
};