import React, { useState } from 'react';
import { GeminiPhoneAnalysis, DeviceType } from '../types';
import { 
    XMarkIcon, 
    DevicePhoneMobileIcon, 
    TabletIcon, 
    TagIcon, 
    ChatBubbleLeftRightIcon, 
    CurrencyDollarIcon, 
    HandThumbUpIcon, 
    HandThumbDownIcon,
    CheckCircleIcon, 
    ExclamationCircleIcon,
    ClipboardDocumentIcon
} from './IconComponents';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: GeminiPhoneAnalysis | null;
  deviceType: DeviceType;
  deviceModel: string;
  // imageUrl and isFetchingImage props removed
}

const ResultModal: React.FC<ResultModalProps> = ({ 
  isOpen, 
  onClose, 
  analysisResult, 
  deviceType, 
  deviceModel
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  if (!isOpen || !analysisResult) {
    return null;
  }

  const deviceDisplayName = deviceType === 'phone' ? 'Telefon' : 'Tablet';
  const fullDeviceName = deviceModel ? `${deviceDisplayName}: ${deviceModel}` : deviceDisplayName;

  const formatAnalysisForCopy = (): string => {
    if (!analysisResult) return "";
    let text = `Výsledek Analýzy pro: ${fullDeviceName}\n`;
    text += "------------------------------------\n";
    if (analysisResult.info_o_zarizeni) {
      text += `Info o zařízení: ${analysisResult.info_o_zarizeni}\n\n`;
    }
    text += `Analýza problému: ${analysisResult.problem_analyza}\n\n`;
    text += `Odhadovaná cena opravy: ${analysisResult.odhadovana_cena_kc} Kč\n\n`; // Updated to number

    if (analysisResult.klady_opravy && analysisResult.klady_opravy.length > 0) {
      text += "Klady opravy:\n";
      analysisResult.klady_opravy.forEach(klad => text += `- ${klad}\n`);
      text += "\n";
    }
    if (analysisResult.zapory_opravy && analysisResult.zapory_opravy.length > 0) {
      text += "Zápory/Rizika opravy:\n";
      analysisResult.zapory_opravy.forEach(zapor => text += `- ${zapor}\n`);
      text += "\n";
    }
    text += "------------------------------------\n";
    text += "Generováno pomocí Diagnostiky Zařízení.";
    return text;
  };

  const handleCopyToClipboard = async () => {
    const textToCopy = formatAnalysisForCopy();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500); 
    } catch (err) {
      console.error('Nepodařilo se zkopírovat text: ', err);
      alert('Nepodařilo se zkopírovat text. Zkuste to prosím znovu nebo ručně.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] p-6 md:p-8 relative animate-slideUp flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-sky-400 transition-colors z-10 p-1 rounded-full hover:bg-slate-700"
          aria-label="Zavřít modální okno"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <header className="mb-6 text-center">
          {/* Device image display section removed */}
          {deviceType === 'phone' ? 
            <DevicePhoneMobileIcon className="w-12 h-12 text-sky-400 mx-auto mb-3" /> : 
            <TabletIcon className="w-12 h-12 text-sky-400 mx-auto mb-3" />
          }
          <h2 id="result-modal-title" className="text-2xl md:text-3xl font-bold text-sky-400">
            Výsledek Analýzy
          </h2>
          <p className="text-slate-400 mt-1">{fullDeviceName}</p>
        </header>

        <div className="space-y-5 flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
          {analysisResult.info_o_zarizeni && (
            <section aria-labelledby="device-info-heading">
              <h3 id="device-info-heading" className="text-lg font-semibold text-sky-500 mb-2 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 opacity-80 flex-shrink-0" />
                Stručné info o zařízení:
              </h3>
              <p className="bg-slate-700/60 p-3 rounded-md text-slate-300 text-sm whitespace-pre-wrap shadow-inner">
                {analysisResult.info_o_zarizeni}
              </p>
            </section>
          )}

          <section aria-labelledby="problem-analysis-heading">
            <h3 id="problem-analysis-heading" className="text-lg font-semibold text-sky-500 mb-2 flex items-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 opacity-80 flex-shrink-0" />
              Analýza problému:
            </h3>
            <p className="bg-slate-700/60 p-3 rounded-md text-slate-200 whitespace-pre-wrap shadow-inner">
              {analysisResult.problem_analyza}
            </p>
          </section>

          <section aria-labelledby="price-estimation-heading">
            <h3 id="price-estimation-heading" className="text-lg font-semibold text-sky-500 mb-2 flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 opacity-80 flex-shrink-0" />
              Odhadovaná cena opravy:
            </h3>
            <p className="bg-slate-700/60 p-3 rounded-md text-slate-100 text-xl font-bold shadow-inner">
              {analysisResult.odhadovana_cena_kc.toLocaleString('cs-CZ')} Kč 
            </p>
          </section>

          {analysisResult.klady_opravy && analysisResult.klady_opravy.length > 0 && (
            <section aria-labelledby="pros-heading">
              <h3 id="pros-heading" className="text-lg font-semibold text-green-500 mb-2 flex items-center">
                <HandThumbUpIcon className="w-5 h-5 mr-2 opacity-80 flex-shrink-0" />
                Klady opravy:
              </h3>
              <ul className="list-none bg-slate-700/60 p-3 rounded-md text-slate-300 space-y-0.5 shadow-inner">
                {analysisResult.klady_opravy.map((pro, index) => (
                  <li key={`pro-${index}`} className="flex items-start p-1.5 rounded hover:bg-slate-600/70 transition-colors duration-150 cursor-default">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2.5 mt-1 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {analysisResult.zapory_opravy && analysisResult.zapory_opravy.length > 0 && (
            <section aria-labelledby="cons-heading">
              <h3 id="cons-heading" className="text-lg font-semibold text-amber-500 mb-2 flex items-center">
                <HandThumbDownIcon className="w-5 h-5 mr-2 opacity-80 flex-shrink-0" />
                Zápory/Rizika opravy:
              </h3>
              <ul className="list-none bg-slate-700/60 p-3 rounded-md text-slate-300 space-y-0.5 shadow-inner">
                {analysisResult.zapory_opravy.map((con, index) => (
                  <li key={`con-${index}`} className="flex items-start p-1.5 rounded hover:bg-slate-600/70 transition-colors duration-150 cursor-default">
                    <ExclamationCircleIcon className="w-4 h-4 text-amber-400 mr-2.5 mt-1 flex-shrink-0" />
                   <span>{con}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row-reverse justify-between items-center gap-4">
            <button
                onClick={onClose}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 shadow-md hover:shadow-lg"
            >
                Zavřít
            </button>
            <button
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-200 font-semibold py-2.5 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 flex items-center justify-center space-x-2 shadow-md"
                disabled={isCopied}
                aria-live="polite"
            >
                <ClipboardDocumentIcon className="w-5 h-5"/>
                <span>{isCopied ? 'Zkopírováno!' : 'Kopírovat souhrn'}</span>
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ResultModal;