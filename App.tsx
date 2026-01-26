import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/ui/FileUpload';
import { Button } from './components/ui/Button';
import { TextInput } from './components/ui/TextInput';
import { generatePehanawaOutfit } from './services/geminiService';
import { PehanawaConfig, WizardStep, SuitPieceCount, Category, EthnicType } from './types';

const App: React.FC = () => {
  // State Machine
  const [step, setStep] = useState<WizardStep>('SELECT_CATEGORY');
  const [config, setConfig] = useState<PehanawaConfig>({
    category: 'SUIT', 
    pieceCount: 2,
    clothImage: null,
    shirtOption: 'none',
    shirtImage: null,
    customerImage: null,
    ethnicType: 'kurta',
    styleReferenceImage: null,
    customPrompt: '',
  });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Theme Logic
  const [themeMode, setThemeMode] = useState<'default' | 'ethnic'>('default');
  
  // Update theme based on category
  useEffect(() => {
    if (config.category === 'ETHNIC') {
      setThemeMode('ethnic');
    } else {
      setThemeMode('default');
    }
  }, [config.category]);

  // Navigation Helpers
  const goTo = (nextStep: WizardStep) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(nextStep);
  };

  // Handlers
  const handleCategorySelect = (category: Category) => {
    setConfig({ ...config, category });
    
    // Slight delay to allow theme transition before moving
    setTimeout(() => {
        switch (category) {
            case 'SUIT': goTo('SELECT_SUIT_TYPE'); break;
            case 'ETHNIC': goTo('SELECT_ETHNIC_TYPE'); break;
            case 'SHIRTING': goTo('UPLOAD_CLOTH'); break;
            case 'PANTS': goTo('UPLOAD_CLOTH'); break;
            case 'OTHERS': goTo('SELECT_OTHERS_MODE'); break;
        }
    }, 100);
  };

  const handleSuitTypeSelect = (count: SuitPieceCount) => {
    setConfig({ ...config, pieceCount: count });
    goTo('UPLOAD_CLOTH');
  };

  const handleEthnicTypeSelect = (type: EthnicType) => {
    setConfig({ ...config, ethnicType: type });
    if (type === 'custom') {
      goTo('UPLOAD_STYLE_REF');
    } else {
      goTo('UPLOAD_CLOTH');
    }
  };

  const handleOthersModeSelect = (mode: 'text' | 'image') => {
    if (mode === 'text') goTo('INPUT_PROMPT');
    else goTo('UPLOAD_STYLE_REF');
  };

  const handlePromptSubmit = (prompt: string) => {
    setConfig({ ...config, customPrompt: prompt });
    goTo('UPLOAD_CLOTH');
  };

  const handleStyleRefUpload = (file: File) => {
    setConfig({ ...config, styleReferenceImage: file });
    goTo('UPLOAD_CLOTH');
  };

  const handleClothUpload = (file: File) => {
    setConfig({ ...config, clothImage: file });
    if (config.category === 'SUIT') {
      goTo('SHIRT_DECISION');
    } else {
      goTo('UPLOAD_CUSTOMER');
    }
  };

  const handleShirtDecision = (addShirt: boolean) => {
    if (addShirt) {
      goTo('SHIRT_INPUT');
    } else {
      setConfig({ ...config, shirtOption: 'none' });
      goTo('UPLOAD_CUSTOMER');
    }
  };

  const handleShirtInput = (option: 'white' | 'black' | 'custom-image', file?: File) => {
    setConfig({ ...config, shirtOption: option, shirtImage: file || null });
    goTo('UPLOAD_CUSTOMER');
  };

  const handleCustomerUpload = (file: File) => {
    setConfig({ ...config, customerImage: file });
  };

  const handleGenerate = async () => {
    if (!config.customerImage || !config.clothImage) return;
    goTo('GENERATING');
    setError(null);
    try {
      const result = await generatePehanawaOutfit(config);
      setResultImage(result);
      goTo('RESULT');
    } catch (err: any) {
      setError(err.message || "Failed. Try again.");
      goTo('UPLOAD_CUSTOMER');
    }
  };

  const reset = () => {
    setConfig({
      category: 'SUIT',
      pieceCount: 2,
      clothImage: null,
      shirtOption: 'none',
      shirtImage: null,
      customerImage: null,
      ethnicType: 'kurta',
      styleReferenceImage: null,
      customPrompt: '',
    });
    setResultImage(null);
    setThemeMode('default'); // Force reset theme
    goTo('SELECT_CATEGORY');
  };

  // --- Dynamic Styles ---
  const isEthnic = themeMode === 'ethnic';
  const mainContainerClasses = isEthnic 
    ? 'bg-ethnic-bg text-ethnic-accent selection:bg-ethnic-accent selection:text-ethnic-bg' 
    : 'bg-white text-black selection:bg-black selection:text-white';
  
  const headingClasses = isEthnic
    ? 'text-4xl md:text-5xl font-serif italic text-ethnic-accent tracking-tight'
    : 'text-4xl md:text-5xl font-bold tracking-tighter';

  const subHeadingClasses = isEthnic
    ? 'text-sm font-sans uppercase tracking-[0.2em] text-ethnic-accent/60 mt-4'
    : 'text-sm font-sans uppercase tracking-[0.2em] text-gray-400 mt-4';

  const cardBaseClasses = isEthnic
    ? 'group relative h-48 md:h-56 p-8 text-left transition-all duration-500 flex flex-col justify-between border border-ethnic-border hover:border-ethnic-accent/50 bg-white/50 hover:bg-white hover:shadow-xl hover:shadow-ethnic-accent/5'
    : 'group relative h-48 md:h-56 p-8 text-left transition-all duration-500 flex flex-col justify-between border border-gray-100 hover:border-black bg-gray-50 hover:bg-white hover:shadow-2xl';

  const cardTextPrimary = isEthnic ? 'text-3xl font-serif italic text-ethnic-accent' : 'text-3xl font-serif italic text-black';
  const cardTextSecondary = isEthnic ? 'text-[10px] uppercase tracking-[0.2em] text-ethnic-accent/50 group-hover:text-ethnic-accent' : 'text-[10px] uppercase tracking-[0.2em] text-gray-400 group-hover:text-black';

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="space-y-12 animate-slide-up">
      <div className="text-center md:text-left mb-16">
        <h2 className={headingClasses}>Select Category.</h2>
        <p className={subHeadingClasses}>What are we designing today?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => handleCategorySelect('SUIT')} className={cardBaseClasses}>
          <span className={cardTextPrimary}>Suiting</span>
          <span className={cardTextSecondary}>Bespoke Tailoring</span>
        </button>

        <button onClick={() => handleCategorySelect('ETHNIC')} className={cardBaseClasses}>
          <span className={cardTextPrimary}>Ethnic</span>
          <span className={cardTextSecondary}>Traditional Wear</span>
        </button>

        <button onClick={() => handleCategorySelect('SHIRTING')} className={cardBaseClasses}>
          <span className={cardTextPrimary}>Shirting</span>
          <span className={cardTextSecondary}>Fine Fabrics</span>
        </button>

        <button onClick={() => handleCategorySelect('PANTS')} className={cardBaseClasses}>
          <span className={cardTextPrimary}>Pants</span>
          <span className={cardTextSecondary}>Trousers & Chinos</span>
        </button>

        <button onClick={() => handleCategorySelect('OTHERS')} className={`group relative h-40 p-8 text-left md:col-span-2 flex items-center justify-between transition-all duration-500 ${isEthnic ? 'bg-ethnic-accent text-white hover:bg-ethnic-accent/90' : 'bg-black text-white hover:bg-gray-900'}`}>
          <span className="text-3xl font-serif italic">Others / Custom</span>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100">Avant Garde</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'SELECT_CATEGORY': return renderDashboard();

      case 'SELECT_SUIT_TYPE':
        return (
          <div className="space-y-12 animate-slide-up">
             <div className="text-center">
                 <h2 className={headingClasses}>Suit Configuration.</h2>
                 <p className={subHeadingClasses}>Define the silhouette</p>
             </div>
             <div className="space-y-4 max-w-sm mx-auto">
                {[1, 2, 3].map((num) => (
                  <Button key={num} onClick={() => handleSuitTypeSelect(num as SuitPieceCount)} variant="outline" theme={themeMode} className="justify-between px-8">
                    <span className="font-serif italic text-2xl">{num} Piece</span>
                    <span className="text-xs uppercase tracking-widest opacity-50">Select</span>
                  </Button>
                ))}
             </div>
          </div>
        );

      case 'SELECT_ETHNIC_TYPE':
        return (
          <div className="space-y-12 animate-slide-up">
             <div className="text-center">
                <h2 className={headingClasses}>Ethnic Style.</h2>
                <p className={subHeadingClasses}>Rooted in tradition</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['kurta', 'sherwani', 'modi-jacket', 'bandi'].map((t) => (
                   <Button key={t} onClick={() => handleEthnicTypeSelect(t as EthnicType)} variant="outline" theme={themeMode} className="h-32">
                     <span className="capitalize font-serif italic text-2xl">{t.replace('-', ' ')}</span>
                   </Button>
                ))}
                <div className="md:col-span-2">
                    <Button onClick={() => handleEthnicTypeSelect('custom')} variant="primary" theme={themeMode} className="h-24">
                    Upload Custom Reference
                    </Button>
                </div>
             </div>
          </div>
        );

      case 'SELECT_OTHERS_MODE':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>Design Approach.</h2>
                 <p className={subHeadingClasses}>How should we proceed?</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Button onClick={() => handleOthersModeSelect('text')} variant="outline" theme={themeMode} className="h-40 flex-col gap-2">
                <span className="text-2xl font-serif italic">Words</span>
                <span className="text-xs opacity-50 uppercase tracking-widest">Describe your vision</span>
              </Button>
              <Button onClick={() => handleOthersModeSelect('image')} variant="primary" theme={themeMode} className="h-40 flex-col gap-2">
                <span className="text-2xl font-serif italic">Reference</span>
                <span className="text-xs opacity-50 uppercase tracking-widest">Upload visual guide</span>
              </Button>
            </div>
          </div>
        );

      case 'INPUT_PROMPT':
        return (
          <div className="space-y-12 animate-slide-up">
             <div className="text-center">
                 <h2 className={headingClasses}>The Vision.</h2>
                 <p className={subHeadingClasses}>Describe in detail</p>
             </div>
             <TextInput 
               label="Style Description"
               placeholder="e.g., A high-collar trench coat with asymmetrical buttons..."
               onBlur={(e) => handlePromptSubmit(e.target.value)}
             />
             {config.customPrompt && (
               <Button onClick={() => goTo('UPLOAD_CLOTH')} theme={themeMode}>Continue</Button>
             )}
          </div>
        );

      case 'UPLOAD_STYLE_REF':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>Reference.</h2>
                 <p className={subHeadingClasses}>Upload style to copy</p>
             </div>
            <FileUpload 
              label="Style Image" 
              selectedFile={config.styleReferenceImage || null} 
              onFileSelect={handleStyleRefUpload} 
              theme={themeMode}
            />
          </div>
        );

      case 'UPLOAD_CLOTH':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>Material.</h2>
                 <p className={subHeadingClasses}>
                    {config.category === 'SHIRTING' || config.category === 'PANTS' 
                        ? 'AI will analyze fabric type' 
                        : 'Source Fabric'}
                 </p>
             </div>
            <FileUpload 
              label="Cloth / Fabric" 
              selectedFile={config.clothImage} 
              onFileSelect={handleClothUpload} 
              theme={themeMode}
            />
          </div>
        );

      case 'SHIRT_DECISION':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>Layering.</h2>
                 <p className={subHeadingClasses}>Add a shirt inside?</p>
             </div>
            <div className="grid grid-cols-2 gap-6">
               <Button onClick={() => handleShirtDecision(true)} variant="primary" theme={themeMode} className="h-32 text-xl">Yes</Button>
               <Button onClick={() => handleShirtDecision(false)} variant="secondary" theme={themeMode} className="h-32 text-xl">No</Button>
            </div>
          </div>
        );

      case 'SHIRT_INPUT':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>Shirt Selection.</h2>
                 <p className={subHeadingClasses}>Choose the inner layer</p>
             </div>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => handleShirtInput('white')} className="h-40 border border-gray-200 hover:border-black transition-all duration-300 flex flex-col items-center justify-center bg-white group">
                <span className="block w-12 h-12 bg-white border border-gray-200 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform"></span>
                <span className="font-serif italic text-xl">White</span>
              </button>
              <button onClick={() => handleShirtInput('black')} className="h-40 bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 flex flex-col items-center justify-center group">
                <span className="block w-12 h-12 bg-black border border-gray-600 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform"></span>
                <span className="font-serif italic text-xl">Black</span>
              </button>
            </div>
            <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-gray-400">Or Custom</span>
            </div>
            <FileUpload label="Upload Shirt" selectedFile={config.shirtImage || null} onFileSelect={(f) => handleShirtInput('custom-image', f)} theme={themeMode} />
          </div>
        );

      case 'UPLOAD_CUSTOMER':
        return (
          <div className="space-y-12 animate-slide-up">
            <div className="text-center">
                 <h2 className={headingClasses}>The Subject.</h2>
                 <p className={subHeadingClasses}>Who is wearing this?</p>
             </div>
            <FileUpload 
              label="Customer Photo" 
              selectedFile={config.customerImage} 
              onFileSelect={handleCustomerUpload} 
              capture="user"
              theme={themeMode}
            />
            {config.customerImage && (
              <Button onClick={handleGenerate} theme={themeMode} className="mt-8 animate-pulse-slow">
                Visualize Look
              </Button>
            )}
            {error && <p className="text-red-500 text-center mt-4 text-sm font-medium">{error}</p>}
          </div>
        );

      case 'GENERATING':
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in">
            <div className={`w-20 h-20 border-2 ${isEthnic ? 'border-ethnic-accent/20 border-t-ethnic-accent' : 'border-gray-100 border-t-black'} rounded-full animate-spin mb-8`}></div>
            <h2 className={`${headingClasses} animate-pulse`}>Constructing...</h2>
            <p className={subHeadingClasses}>Stitching pixels together</p>
          </div>
        );

      case 'RESULT':
        return (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center">
                <h2 className={headingClasses}>The Final Look.</h2>
             </div>
             
             {resultImage && (
               <div className={`p-4 border shadow-2xl transition-all duration-1000 ${isEthnic ? 'bg-white border-ethnic-border shadow-ethnic-accent/10' : 'bg-white border-gray-100 shadow-black/5'}`}>
                  <img src={resultImage} alt="Final" className="w-full h-auto" />
               </div>
             )}

             <div className="grid grid-cols-2 gap-6">
               <Button onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultImage || '';
                  link.download = 'pehanawa-look.png';
                  link.click();
               }} variant="outline" theme={themeMode}>
                 Save
               </Button>
               <Button onClick={reset} variant="primary" theme={themeMode}>
                 New Design
               </Button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out font-sans ${mainContainerClasses}`}>
      <Header theme={isEthnic ? 'ethnic' : 'light'} />
      <main className="max-w-3xl mx-auto px-6 pb-24 pt-4">
        {renderContent()}
        
        {step !== 'SELECT_CATEGORY' && step !== 'RESULT' && step !== 'GENERATING' && (
           <div className="fixed bottom-10 left-0 w-full text-center pointer-events-none z-50">
             <button 
               onClick={() => setStep('SELECT_CATEGORY')} 
               className={`pointer-events-auto text-xs uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b border-transparent ${isEthnic ? 'text-ethnic-accent/40 hover:text-ethnic-accent hover:border-ethnic-accent' : 'text-gray-300 hover:text-black hover:border-black'}`}
             >
               Abort Process
             </button>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;