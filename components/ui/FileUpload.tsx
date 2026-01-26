import React, { useRef, useState, useEffect } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  capture?: "user" | "environment";
  theme?: 'default' | 'ethnic';
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFileSelect, 
  selectedFile, 
  capture = "environment",
  theme = 'default' 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const isEthnic = theme === 'ethnic';

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const borderColor = isEthnic ? 'border-ethnic-accent/20 hover:border-ethnic-accent/60' : 'border-gray-200 hover:border-black';
  const bgColor = isEthnic ? 'bg-white/50' : 'bg-gray-50';
  const iconColor = isEthnic ? 'text-ethnic-accent/40' : 'text-gray-300';
  const textColor = isEthnic ? 'text-ethnic-accent' : 'text-black';

  return (
    <div 
      className={`w-full h-80 ${bgColor} border ${borderColor} transition-all duration-500 cursor-pointer relative flex flex-col items-center justify-center overflow-hidden group`}
      onClick={() => inputRef.current?.click()}
    >
      {/* Decorative corners for ethnic theme */}
      {isEthnic && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ethnic-accent/40 m-2"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-ethnic-accent/40 m-2"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-ethnic-accent/40 m-2"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ethnic-accent/40 m-2"></div>
        </>
      )}

      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept="image/*" 
        capture={capture} 
        onChange={handleChange} 
      />
      
      {preview ? (
        <div className="w-full h-full p-4 relative">
            <img src={preview} alt="Preview" className="w-full h-full object-contain drop-shadow-xl" />
            <div className={`absolute bottom-0 left-0 w-full py-2 text-center text-xs uppercase tracking-widest backdrop-blur-md ${isEthnic ? 'bg-ethnic-accent/10 text-ethnic-accent' : 'bg-white/80 text-black'}`}>
                Replace Image
            </div>
        </div>
      ) : (
        <div className="text-center p-8 transition-transform duration-500 group-hover:scale-105">
          <div className="mb-6 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={`w-12 h-12 ${iconColor}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
          <span className={`text-2xl font-serif italic ${textColor} block mb-2`}>{label}</span>
          <span className={`text-[10px] uppercase tracking-[0.2em] ${isEthnic ? 'text-ethnic-accent/50' : 'text-gray-400'}`}>Tap to Select</span>
        </div>
      )}
    </div>
  );
};