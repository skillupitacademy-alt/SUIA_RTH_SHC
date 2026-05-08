'use client';

import React, { useState } from 'react';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { skillUpConfig } from '@/share-branding/brandConfig';

interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
  formatted?: string;
}

function JsonValidatorContent() {
  const brand = useBrand();
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateJson = () => {
    if (!jsonInput.trim()) {
      setValidationResult({
        isValid: false,
        message: 'Please paste some JSON content',
        errors: ['Input is empty']
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      
      setValidationResult({
        isValid: true,
        message: '✓ Valid JSON! Your content is properly formatted.',
        formatted: formatted
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errors = [errorMessage];
      
      // Try to provide helpful error messages
      if (errorMessage.includes('Unexpected token')) {
        errors.push('Check for missing commas, quotes, or brackets');
      }
      if (errorMessage.includes('Unexpected end')) {
        errors.push('Check if all brackets and braces are closed');
      }
      
      setValidationResult({
        isValid: false,
        message: '✗ Invalid JSON',
        errors: errors
      });
    }
  };

  const clearInput = () => {
    setJsonInput('');
    setValidationResult(null);
  };

  const copyFormatted = () => {
    if (validationResult?.formatted) {
      navigator.clipboard.writeText(validationResult.formatted);
      alert('Formatted JSON copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
            <h1 className="text-4xl font-bold text-white mb-3">✓ JSON Validator & Formatter</h1>
            <p className="text-white text-lg font-semibold">Validate and format your AI-generated JSON content</p>
          </div>

          {/* Info Box */}
          <div className="p-6 bg-blue-50 border-l-4 border-blue-500 m-6 rounded-lg">
            <p className="text-blue-900 font-medium leading-relaxed">
              <strong>How to use:</strong> Paste your AI-generated JSON content below and click Validate. 
              The tool will check for syntax errors and format it properly.
            </p>
          </div>

          {/* Input Section */}
          <section className="p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label htmlFor="jsonInput" className="block text-lg font-semibold text-gray-800">
                  Paste Your JSON Here
                </label>
                <button
                  onClick={clearInput}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                id="jsonInput"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"notes": {"coreDefinition": {...}}}'
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <button
              onClick={validateJson}
              className="w-full py-4 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Validate JSON
            </button>
          </section>
        </header>

        {/* Validation Result */}
        {validationResult && (
          <section className={`rounded-2xl shadow-2xl overflow-hidden ${validationResult.isValid ? 'bg-green-50' : 'bg-red-50'}`} aria-label="Validation results">
            <div className={`p-6 border-b ${validationResult.isValid ? 'border-green-200 bg-green-100' : 'border-red-200 bg-red-100'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-bold ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.message}
                </h3>
                {validationResult.isValid && (
                  <button
                    onClick={copyFormatted}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Copy Formatted JSON
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {validationResult.isValid ? (
                <div>
                  <h4 className="text-lg font-semibold text-green-800 mb-3">Formatted JSON:</h4>
                  <div className="bg-white border border-green-300 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                    {validationResult.formatted}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-semibold text-red-800 mb-3">Errors Found:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {validationResult.errors?.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-yellow-800 font-semibold mb-2">Common JSON Mistakes:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                      <li>Missing commas between properties</li>
                      <li>Using single quotes instead of double quotes</li>
                      <li>Trailing commas after the last property</li>
                      <li>Unescaped special characters in strings</li>
                      <li>Missing closing brackets or braces</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function JsonValidatorPage() {
  return (
    <BrandProvider brand={skillUpConfig}>
      <JsonValidatorContent />
    </BrandProvider>
  );
}
