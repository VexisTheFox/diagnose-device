import React, { useState, useCallback } from 'react';
import { XMarkIcon, SparklesIcon, ExclamationCircleIcon } from './IconComponents';

interface ModelLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceIdentified: (deviceName: string) => void;
  identifyDeviceFunction: (modelNumber: string) => Promise<string>;
}

const ModelLookupModal: React.FC<ModelLookupModalProps> = ({ 
  isOpen, 
  onClose, 
  onDeviceIdentified,
  identifyDeviceFunction
}) => {
  const [modelNumberInput, setModelNumberInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modelNumberInput.trim()) {
      setError('Prosím, zadejte modelové číslo.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const deviceName = await identifyDeviceFunction(modelNumberInput.trim());
      onDeviceIdentified(deviceName);
      setModelNumberInput(''); // Clear input on success
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Došlo k neznámé chybě při identifikaci modelu.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [modelNumberInput, identifyDeviceFunction, onDeviceIdentified]);

  const handleClose = () => {
    setModelNumberInput('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-lookup-modal-title"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8 relative animate-slideUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-sky-400 transition-colors z-10 p-1 rounded-full hover:bg-slate-700"
          aria-label="Zavřít modální okno"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <header className="mb-6 text-center">
          <SparklesIcon className="w-10 h-10 text-sky-400 mx-auto mb-3" />
          <h2 id="model-lookup-modal-title" className="text-xl md:text-2xl font-bold text-sky-400">
            Zjistit model zařízení
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Zadejte modelové číslo (např. SM-G998B, A2643).</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modelNumberInput" className="sr-only">
              Modelové číslo
            </label>
            <input
              type="text"
              id="modelNumberInput"
              value={modelNumberInput}
              onChange={(e) => {
                setModelNumberInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Např. SM-A525F, 2201116SG..."
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-slate-500 shadow-inner"
              disabled={isLoading}
              aria-describedby={error ? "model-lookup-error" : undefined}
            />
          </div>

          {error && (
            <div id="model-lookup-error" role="alert" className="p-3 bg-red-800/50 border border-red-700 rounded-lg text-red-300 text-sm flex items-start space-x-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !modelNumberInput.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:text-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 flex items-center justify-center space-x-2 shadow-md"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zjišťuji...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-1.5" />
                Zjistit a vyplnit model
              </>
            )}
          </button>
        </form>
        
        <button
            onClick={handleClose}
            className="mt-4 w-full text-slate-400 hover:text-slate-300 py-2.5 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
        >
            Zrušit
        </button>
      </div>
    </div>
  );
};

export default ModelLookupModal;