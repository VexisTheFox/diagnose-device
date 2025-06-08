import React, { useState, useCallback, useEffect } from 'react';
import { analyzePhoneProblem, identifyDeviceByModelNumber } from './services/geminiService';
import { GeminiPhoneAnalysis, StoredAnalysis, DeviceType } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import ResultModal from './components/ResultModal';
import HistoryModal from './components/HistoryModal';
import ModelLookupModal from './components/ModelLookupModal'; // Nový import
import { PhoneIcon, WrenchScrewdriverIcon, ExclamationCircleIcon, BackspaceIcon, ClockIcon, SparklesIcon } from './components/IconComponents';

const MAX_HISTORY_ITEMS = 20;
const LOCAL_STORAGE_KEY = 'phoneAnalysisHistory';

const App: React.FC = () => {
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [deviceType, setDeviceType] = useState<DeviceType>('phone');
  const [deviceModel, setDeviceModel] = useState<string>('');
  
  const [analysisResult, setAnalysisResult] = useState<GeminiPhoneAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isModelLookupModalOpen, setIsModelLookupModalOpen] = useState<boolean>(false); // Stav pro nový modal
  const [analysisHistory, setAnalysisHistory] = useState<StoredAnalysis[]>([]);

  // Stavy deviceImageUrl a isFetchingDeviceImage odebrány

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        setAnalysisHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Chyba při načítání historie z localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY); 
    }
  }, []);

  const saveAnalysisToHistory = useCallback((
    result: GeminiPhoneAnalysis, 
    currentProblemDescription: string, 
    currentDeviceType: DeviceType, 
    currentDeviceModel: string
  ) => {
    const newEntry: StoredAnalysis = {
      ...result,
      id: Date.now().toString(),
      timestamp: Date.now(),
      deviceType: currentDeviceType,
      deviceModel: currentDeviceModel,
      problemDescription: currentProblemDescription,
      // imageUrl odebráno
    };

    setAnalysisHistory(prevHistory => {
      const updatedHistory = [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Chyba při ukládání historie do localStorage:", e);
      }
      return updatedHistory;
    });
  }, []);
  
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problemDescription.trim()) {
      setError('Prosím, popište problém s vaším zařízením.');
      setAnalysisResult(null);
      setIsModalOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setIsModalOpen(false);

    const currentProblemDescription = problemDescription;
    const currentDeviceType = deviceType;
    const currentDeviceModel = deviceModel;

    try {
      const fetchedGeminiResult = await analyzePhoneProblem(currentProblemDescription, currentDeviceType, currentDeviceModel);
      setAnalysisResult(fetchedGeminiResult);
      
      if (fetchedGeminiResult) {
        saveAnalysisToHistory(fetchedGeminiResult, currentProblemDescription, currentDeviceType, currentDeviceModel);
        setIsModalOpen(true);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Došlo k neznámé chybě při získávání analýzy.');
      }
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [problemDescription, deviceType, deviceModel, saveAnalysisToHistory]);

  const clearAndResetStates = () => {
    setError(null);
    setAnalysisResult(null);
    setIsModalOpen(false);
  }

  const handleClearForm = () => {
    setProblemDescription('');
    setDeviceModel('');
    clearAndResetStates();
  };

  const isFormEmpty = !problemDescription.trim() && !deviceModel.trim();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProblemDescription(e.target.value);
    if (error || analysisResult || isModalOpen) {
       clearAndResetStates();
    }
  };

  const handleDeviceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeviceType(e.target.value as DeviceType);
     if (error || analysisResult || isModalOpen) {
       clearAndResetStates();
    }
  };

  const handleDeviceModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceModel(e.target.value);
    if (error || analysisResult || isModalOpen) {
       clearAndResetStates();
    }
  };

  const getDeviceModelPlaceholder = () => {
    if (deviceType === 'phone') {
      return "Např. Samsung Galaxy S21, iPhone 13 Pro...";
    }
    return "Např. iPad Air 5, Samsung Galaxy Tab S8...";
  }

  const closeModal = () => {
    setIsModalOpen(false);
  }

  const openHistoryModal = () => setIsHistoryModalOpen(true);
  const closeHistoryModal = () => setIsHistoryModalOpen(false);

  // Funkce pro ModelLookupModal
  const openModelLookupModal = () => setIsModelLookupModalOpen(true);
  const closeModelLookupModal = () => setIsModelLookupModalOpen(false);
  const handleDeviceIdentified = (identifiedModelName: string) => {
    setDeviceModel(identifiedModelName);
    closeModelLookupModal();
     if (error || analysisResult || isModalOpen) { // Reset if any result was shown for previous model
       clearAndResetStates();
    }
  };


  const viewHistoryItem = async (item: StoredAnalysis) => {
    setProblemDescription(item.problemDescription);
    setDeviceType(item.deviceType);
    setDeviceModel(item.deviceModel);
    const geminiResultFromHistory: GeminiPhoneAnalysis = { 
        problem_analyza: item.problem_analyza,
        odhadovana_cena_kc: item.odhadovana_cena_kc,
        klady_opravy: item.klady_opravy,
        zapory_opravy: item.zapory_opravy,
        info_o_zarizeni: item.info_o_zarizeni,
    };
    setAnalysisResult(geminiResultFromHistory);
    
    closeHistoryModal(); 
    setIsModalOpen(true); 
  };

  const clearHistory = () => {
    setAnalysisHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Chyba při mazání historie z localStorage:", e);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <main className="bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 w-full max-w-2xl transform transition-all duration-500 hover:shadow-sky-600/30 mt-8 mb-4">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <PhoneIcon className="w-12 h-12 text-sky-400 mr-3" />
            <WrenchScrewdriverIcon className="w-10 h-10 text-sky-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-400">Diagnostika Zařízení</h1>
          <p className="text-slate-400 mt-2">Popište problém a AI se pokusí odhadnout závadu, cenu, klady a zápory opravy.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="deviceType" className="block text-sm font-medium text-slate-300 mb-1">
              Typ zařízení:
            </label>
            <select
              id="deviceType"
              value={deviceType}
              onChange={handleDeviceTypeChange}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors shadow-inner"
              disabled={isLoading}
              aria-label="Vyberte typ zařízení"
            >
              <option value="phone">Telefon</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div>
            <label htmlFor="deviceModel" className="block text-sm font-medium text-slate-300 mb-1">
              Značka a model zařízení:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="deviceModel"
                value={deviceModel}
                onChange={handleDeviceModelChange}
                placeholder={getDeviceModelPlaceholder()}
                className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-slate-500 shadow-inner"
                disabled={isLoading}
                aria-label="Zadejte značku a model zařízení"
              />
              <button
                type="button"
                onClick={openModelLookupModal}
                disabled={isLoading}
                className="p-3 bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                title="Zjistit model podle modelového čísla"
                aria-label="Zjistit model podle modelového čísla"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>
            </div>
             <p className="text-xs text-slate-400 mt-1">Pro přesnější analýzu. Můžete zkusit zjistit pomocí <SparklesIcon className="w-3 h-3 inline align-baseline -mt-px"/> tlačítka vedle, pokud znáte modelové číslo (např. SM-G998B).</p>
          </div>

          <div>
            <label htmlFor="problemDescription" className="block text-sm font-medium text-slate-300 mb-1">
              Popis problému:
            </label>
            <textarea
              id="problemDescription"
              value={problemDescription}
              onChange={handleInputChange}
              placeholder={`Např. '${deviceType === 'phone' ? 'Telefon' : 'Tablet'} se nenabíjí', 'Displej nereaguje na dotyk', 'Spadl mi do vody a nejde zapnout...'`}
              rows={5}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-slate-500 shadow-inner"
              disabled={isLoading}
              required
              aria-label="Popište problém s vaším zařízením"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
                type="submit"
                disabled={isLoading || !problemDescription.trim()}
                className="w-full sm:flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 flex items-center justify-center space-x-2 shadow-lg hover:shadow-sky-500/30"
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzuji...
                </>
                ) : (
                <span>Odeslat k analýze</span>
                )}
            </button>
            <button
                type="button"
                onClick={handleClearForm}
                disabled={isLoading || isFormEmpty}
                className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-200 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 flex items-center justify-center space-x-2 shadow-md"
                aria-label="Vymazat formulář"
            >
                <BackspaceIcon className="w-5 h-5"/>
                <span>Vymazat</span>
            </button>
          </div>
        </form>

        {isLoading && <LoadingSpinner />}

        {error && !isLoading && (
          <div role="alert" aria-live="assertive" className="mt-6 p-4 bg-red-800/50 border border-red-700 rounded-lg text-red-300 flex items-start space-x-3 transition-opacity duration-300 opacity-100">
            <ExclamationCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
                <h3 className="font-semibold text-red-200">Chyba při analýze</h3>
                <p>{error}</p>
            </div>
          </div>
        )}
      </main>

      <div className="text-center mb-4">
        <button
          onClick={openHistoryModal}
          disabled={isLoading}
          className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed font-medium py-2.5 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 flex items-center justify-center space-x-2 mx-auto bg-slate-800/80 hover:bg-slate-700/80 shadow-lg"
          aria-label="Zobrazit historii analýz"
        >
          <ClockIcon className="w-5 h-5"/>
          <span>Historie analýz ({analysisHistory.length})</span>
        </button>
      </div>

      <footer className="text-center text-slate-500 text-sm pb-4">
        <p>&copy; {new Date().getFullYear()} Diagnostika Zařízení. Využívá Gemini API.</p>
        <p>Upozornění: Odhady jsou generovány AI a mohou být pouze orientační.</p>
        {/* GSMArena attribution removed */}
      </footer>

      <ResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        analysisResult={analysisResult}
        deviceType={deviceType}
        deviceModel={deviceModel}
      />
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={closeHistoryModal}
        historyItems={analysisHistory}
        onViewItem={viewHistoryItem}
        onClearHistory={clearHistory}
      />
      <ModelLookupModal
        isOpen={isModelLookupModalOpen}
        onClose={closeModelLookupModal}
        onDeviceIdentified={handleDeviceIdentified}
        identifyDeviceFunction={identifyDeviceByModelNumber}
      />
    </div>
  );
};

export default App;