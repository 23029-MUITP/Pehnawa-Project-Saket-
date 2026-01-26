import React from 'react';

interface TextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        className={`w-full bg-gray-50 border-b-2 border-gray-200 p-4 text-xl font-serif focus:outline-none focus:border-black transition-colors resize-none placeholder-gray-300 ${className}`}
        rows={3}
        {...props}
      />
    </div>
  );
};