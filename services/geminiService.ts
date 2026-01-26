import { GoogleGenerativeAI } from "@google/generative-ai";
import { PehanawaConfig } from "../types";

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
  return new GoogleGenerativeAI(apiKey);
};

export const generatePehanawaOutfit = async (config: PehanawaConfig): Promise<string> => {
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
    Act as a high-end AI Stylist.
    Task: Visualize a customer wearing a specific garment constructed from a source fabric.

    Reference Images:
    1. IMAGE A (Customer): The person.
    2. IMAGE B (Fabric/Material): The source cloth.
  `;

  // --- SUIT LOGIC ---
  if (config.category === 'SUIT') {
    prompt += `
    Configuration: SUIT.
    Style: ${config.pieceCount}-Piece Suit.
    
    Instructions:
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
      Instructions:
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
    
    Instructions:
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
    
    Instructions:
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
      Instructions:
      - Create an outfit for Customer A.
      - EXACTLY COPY the design and style from Image C.
      - RENDER it using the Fabric from Image B.
      `;
    } else if (config.customPrompt) {
      prompt += `
      Style Description: "${config.customPrompt}"
      
      Instructions:
      - Create an outfit for Customer A based on the "Style Description" above.
      - USE the Fabric from Image B.
      - Be creative but realistic.
      `;
    }
  }

  prompt += `
    General Rules:
    - PRESERVE Customer's (Image A) face and body exactly.
    - High realism, photorealistic texture rendering of Image B.
  `;

  // Prepend text prompt
  parts.unshift({ text: prompt });

  try {
    // Use specific version to avoid ambiguity
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: parts }
      ],
    });

    const candidates = response.response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Generation failed.");

  } catch (error: any) {
    console.error("Pehanawa generation error:", error);
    throw new Error(error.message || "Failed to generate outfit.");
  }
};