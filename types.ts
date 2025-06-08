export interface GeminiPhoneAnalysis {
  id?: string; // Volitelné ID pro ukládání do historie
  timestamp?: number; // Volitelné časové razítko pro ukládání do historie
  problem_analyza: string;
  odhadovana_cena_kc: number; // Změněno na number
  klady_opravy?: string[];
  zapory_opravy?: string[];
  info_o_zarizeni?: string;
}

export type DeviceType = 'phone' | 'tablet';

export interface StoredAnalysis extends Omit<GeminiPhoneAnalysis, 'odhadovana_cena_kc'> {
  id: string; // ID je zde povinné
  timestamp: number; // Časové razítko je zde povinné
  odhadovana_cena_kc: number; // Také number
  deviceType: DeviceType;
  deviceModel: string;
  problemDescription: string; // Uložíme i původní popis problému
  // imageUrl?: string; // Odebráno
}

// These are not used in the current app, but good examples for potential grounding metadata
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}