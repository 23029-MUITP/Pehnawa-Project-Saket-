export type Category = 'SUIT' | 'ETHNIC' | 'SHIRTING' | 'PANTS' | 'OTHERS';
export type SuitPieceCount = 1 | 2 | 3;
export type EthnicType = 'kurta' | 'sherwani' | 'modi-jacket' | 'bandi' | 'custom';
export type ShirtOption = 'none' | 'white' | 'black' | 'custom-image';

export interface PehanawaConfig {
  category: Category;

  // Suit Specific
  pieceCount?: SuitPieceCount;
  shirtOption?: ShirtOption;
  shirtImage?: File | null;

  // Ethnic Specific
  ethnicType?: EthnicType;
  
  // Others / Custom
  customPrompt?: string; // For text-based style description
  
  // Shared
  styleReferenceImage?: File | null; // For Ethnic Custom or Others Custom
  clothImage: File | null; // The fabric or garment to apply
  customerImage: File | null;
}

export type WizardStep = 
  | 'SELECT_CATEGORY'
  | 'SELECT_SUIT_TYPE'
  | 'SELECT_ETHNIC_TYPE'
  | 'SELECT_OTHERS_MODE' // Text vs Image for Others
  | 'INPUT_PROMPT'       // Text input for Others
  | 'UPLOAD_STYLE_REF'   // Image input for Ethnic/Others
  | 'UPLOAD_CLOTH'       // Fabric/Garment
  | 'SHIRT_DECISION'     // Suit only
  | 'SHIRT_INPUT'        // Suit only
  | 'UPLOAD_CUSTOMER'
  | 'GENERATING'
  | 'RESULT';

export interface GenerationResult {
  image: string | null;
  error: string | null;
}

export interface AlchemyInsight {
  title: string;
  description: string;
  suggestion: string;
}