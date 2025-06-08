import React from 'react';
import { StoredAnalysis } from '../types';
import { XMarkIcon, ClockIcon, TrashIcon, DevicePhoneMobileIcon, TabletIcon } from './IconComponents';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: StoredAnalysis[];
  onViewItem: (item: StoredAnalysis) => void;
  onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, historyItems, onViewItem, onClearHistory }) => {
  if (!isOpen) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] p-6 md:p-8 relative animate-slideUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-sky-400 transition-colors z-10 p-1 rounded-full hover:bg-slate-700"
          aria-label="Zavřít modální okno historie"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <header className="mb-6 text-center">
          <ClockIcon className="w-12 h-12 text-sky-400 mx-auto mb-3" />
          <h2 id="history-modal-title" className="text-2xl md:text-3xl font-bold text-sky-400">
            Historie Analýz
          </h2>
        </header>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3 min-h-[100px]"> {/* min-h pro případ prázdné historie */}
          {historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ClockIcon className="w-16 h-16 text-slate-500 mb-4" />
                <p className="text-lg">Vaše historie analýz je prázdná.</p>
                <p className="text-sm text-slate-500">Nové analýzy se zde automaticky uloží.</p>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewItem(item)}
                className="bg-slate-700/70 p-4 rounded-lg hover:bg-slate-600/90 transition-all duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewItem(item)}
                aria-label={`Zobrazit analýzu pro ${item.deviceModel || item.deviceType} ze dne ${formatDate(item.timestamp)}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center text-sky-400 font-semibold text-lg">
                    {item.deviceType === 'phone' ? 
                      <DevicePhoneMobileIcon className="w-6 h-6 mr-2 flex-shrink-0" /> : 
                      <TabletIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                    }
                    <span className="truncate" title={item.deviceModel || (item.deviceType === 'phone' ? 'Telefon' : 'Tablet')}>
                        {item.deviceModel || (item.deviceType === 'phone' ? 'Telefon' : 'Tablet')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatDate(item.timestamp)}</span>
                </div>
                <p className="text-sm text-slate-300 truncate" title={item.problemDescription}>
                  Popis: {item.problemDescription}
                </p>
                 <p className="text-sm text-slate-400 mt-1">
                  Odhad ceny: {item.odhadovana_cena_kc.toLocaleString('cs-CZ')} Kč
                </p>
              </div>
            ))
          )}
        </div>

        <footer className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row-reverse justify-between items-center gap-4">
          <button
            onClick={onClose}
            className={`w-full ${historyItems.length > 0 ? 'sm:w-auto' : 'sm:flex-1'} bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 shadow-md hover:shadow-lg`}
          >
            Zavřít
          </button>
          {historyItems.length > 0 && (
            <button
              onClick={onClearHistory}
              className="w-full sm:w-auto bg-red-700 hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 flex items-center justify-center space-x-2 shadow-md"
              aria-label="Smazat celou historii analýz"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Smazat historii</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default HistoryModal;