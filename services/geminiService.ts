import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiPhoneAnalysis } from '../types';

const API_KEY = process.env.API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";

export const analyzePhoneProblem = async (problemDescription: string, deviceType: 'phone' | 'tablet', deviceModel: string): Promise<GeminiPhoneAnalysis> => {
  if (!API_KEY) {
     return Promise.reject(new Error("API klíč pro Gemini není nakonfigurován. Zkontrolujte proměnnou prostředí API_KEY."));
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const deviceTypeCzech = deviceType === 'phone' ? 'telefonu' : 'tabletu';
  const deviceTypeCzechAccusative = deviceType === 'phone' ? 'telefon' : 'tablet';
  const modelInfo = deviceModel.trim() !== '' ? deviceModel.trim() : 'Není specifikován';

  try {
    const systemInstruction = `Jste expert na opravy mobilních zařízení (telefony a tablety). Vaším úkolem je analyzovat problém popsaný uživatelem pro zadaný typ zařízení (${deviceTypeCzechAccusative}) a případně konkrétní model (${modelInfo}), identifikovat pravděpodobnou závadu a odhadnout cenu opravy v českých korunách (Kč) jako jedno celé číslo (např. 2500, ne "2000-3000 Kč").
Dále uveďte klady a zápory opravy daného problému. Klady a zápory by měly být formátovány jako pole stringů.
Pokud je specifikován model zařízení, pokuste se poskytnout i velmi stručné základní info o zařízení (např. rok vydání, klíčová vlastnost), pokud je to relevantní a snadno dostupné. Toto info je vedlejší.
Používejte aktuální tržní ceny náhradních dílů a běžné ceny práce v českých servisech. Pokud je model specifikován, snažte se odhad ceny upřesnit na základě tohoto modelu. Pokud model není uveden, poskytněte obecnější odhad pro daný typ zařízení.
Odpovídejte pouze česky. Poskytněte odpověď ve formátu JSON. Zajistěte, aby odpověď byla vždy platný JSON objekt bez jakéhokoli dalšího textu nebo markdownu kolem něj.`;
    
    const userPrompt = `Typ zařízení: ${deviceTypeCzech}
Model zařízení: ${modelInfo}
Popis problému: "${problemDescription}"

Vraťte analýzu, odhad ceny (jako celé číslo), klady opravy (jako pole stringů), zápory opravy (jako pole stringů) a volitelně stručné info o zařízení (pokud je model zadán) ve formátu JSON s klíči "problem_analyza", "odhadovana_cena_kc", "klady_opravy", "zapory_opravy", a "info_o_zarizeni".
Příklad formátu (ceny jsou orientační a měly by odpovídat aktuálním cenám dílů a práce pro daný typ zařízení, problém a konkrétní model, je-li uveden):
{
  "problem_analyza": "Pravděpodobně poškozený displej.",
  "odhadovana_cena_kc": 3000,
  "info_o_zarizeni": "Stručné info o zařízení (např. rok vydání), pokud je model specifikován a info je relevantní.",
  "klady_opravy": ["Zachování funkčnosti zařízení.", "Nižší náklady než pořízení nového zařízení."],
  "zapory_opravy": ["Možnost brzkého výskytu jiné závady u staršího zařízení.", "Cena opravy může být neekonomická."]
}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
        }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (
        parsedData &&
        typeof parsedData.problem_analyza === 'string' &&
        typeof parsedData.odhadovana_cena_kc === 'number' && // Změněno na number
        (parsedData.klady_opravy === undefined || (Array.isArray(parsedData.klady_opravy) && parsedData.klady_opravy.every(item => typeof item === 'string'))) &&
        (parsedData.zapory_opravy === undefined || (Array.isArray(parsedData.zapory_opravy) && parsedData.zapory_opravy.every(item => typeof item === 'string'))) &&
        (parsedData.info_o_zarizeni === undefined || typeof parsedData.info_o_zarizeni === 'string')
      ) {
        return {
            ...parsedData,
            klady_opravy: parsedData.klady_opravy || [],
            zapory_opravy: parsedData.zapory_opravy || [],
        };
      } else {
        console.error("Odpověď od Gemini nemá očekávanou strukturu JSON:", parsedData, "Původní text:", response.text);
        throw new Error("Odpověď od AI nemá očekávanou strukturu. Zkuste to prosím znovu s přesnějším popisem nebo ověřte formát odpovědi modelu.");
      }
    } catch (e) {
      console.error("Nepodařilo se parsovat JSON odpověď od Gemini:", e, "Přijatá odpověď:", jsonStr);
      throw new Error("Došlo k chybě při zpracování odpovědi od AI. Ujistěte se, že popis problému je jasný a model vrací validní JSON.");
    }

  } catch (error) {
    console.error("Chyba při komunikaci s Gemini API:", error);
    let errorMessage = "Nepodařilo se získat analýzu. Zkuste to prosím později.";
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
             errorMessage = "API klíč pro Gemini není platný nebo chybí. Zkontrolujte prosím konfiguraci.";
        } else if (error.message.toLowerCase().includes("quota") || error.message.includes("resource_exhausted")) {
            errorMessage = "Byl překročen limit požadavků na API. Zkuste to prosím později.";
        } else if (error.message.toLowerCase().includes("model not found") || error.message.toLowerCase().includes("permission_denied")) {
            errorMessage = `Model ${GEMINI_MODEL} nebyl nalezen nebo k němu nemáte oprávnění. Zkontrolujte název modelu a API klíč.`;
        } else if (error.message.toLowerCase().includes("candidate was blocked due to safety")) {
            errorMessage = "Odpověď byla blokována z bezpečnostních důvodů. Zkuste přeformulovat dotaz.";
        } else if (error.message.includes("Odpověď od AI nemá očekávanou strukturu") || error.message.includes("Došlo k chybě při zpracování odpovědi od AI")) {
            errorMessage = error.message; 
        }
    }
    throw new Error(errorMessage);
  }
};

export const identifyDeviceByModelNumber = async (modelNumber: string): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject(new Error("API klíč pro Gemini není nakonfigurován. Zkontrolujte proměnnou prostředí API_KEY."));
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const systemInstruction = `Jste expert na mobilní zařízení. Vaším úkolem je na základě zadaného modelového čísla (např. SM-G998B, A2643, 2201116SG) identifikovat plný název zařízení (značka a model). Odpovídejte pouze plným názvem zařízení. Například: "Samsung Galaxy S21 Ultra", "Apple iPhone 13 Pro", "Xiaomi Poco X4 Pro 5G". Pokud modelové číslo není rozpoznatelné nebo je nejednoznačné, odpovězte prázdným řetězcem. Neuvádějte žádný další text, pouze název zařízení nebo prázdný řetězec.`;
  
  const userPrompt = `Identifikuj zařízení s modelovým číslem: "${modelNumber}".`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Lower temperature for more deterministic output
      }
    });

    const identifiedName = response.text.trim();
    
    if (identifiedName === "") {
        throw new Error("Modelové číslo nebylo rozpoznáno nebo je nejednoznačné.");
    }
    // Basic validation: ensure it's not overly long or contains typical error phrases from less constrained models
    if (identifiedName.length > 0 && identifiedName.length < 100 && !identifiedName.toLowerCase().includes("nemohu") && !identifiedName.toLowerCase().includes("chyba")) {
      return identifiedName;
    } else {
      console.warn("Podezřelá odpověď při identifikaci zařízení:", identifiedName);
      throw new Error("Nepodařilo se spolehlivě identifikovat zařízení podle modelového čísla.");
    }

  } catch (error) {
    console.error("Chyba při identifikaci zařízení pomocí Gemini:", error);
    let errorMessage = "Nepodařilo se identifikovat zařízení. Zkuste to prosím později nebo zadejte model ručně.";
     if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
             errorMessage = "API klíč pro Gemini není platný nebo chybí.";
        } else if (error.message.toLowerCase().includes("quota")) {
            errorMessage = "Byl překročen limit požadavků na API.";
        } else if (error.message.includes("Modelové číslo nebylo rozpoznáno") || error.message.includes("Nepodařilo se spolehlivě identifikovat")) {
            errorMessage = error.message;
        }
    }
    throw new Error(errorMessage);
  }
};