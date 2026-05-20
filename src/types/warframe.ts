/* Minimal typings for the warframestat.us payloads we consume. */

export interface NewsItem {
  id: string;
  message: string;
  link: string;
  imageLink?: string;
  date: string;
  eta?: string;
}

export interface WorldEvent {
  id: string;
  description?: string;
  node?: string;
  expiry?: string;
  rewards?: { asString?: string }[];
}

export interface CycleState {
  id: string;
  state?: string;
  isDay?: boolean;
  isWarm?: boolean;
  timeLeft?: string;
  expiry?: string;
}

export interface Worldstate {
  timestamp?: string;
  news?: NewsItem[];
  events?: WorldEvent[];
  alerts?: WorldEvent[];
  cetusCycle?: CycleState;
  vallisCycle?: CycleState;
  cambionCycle?: CycleState;
  earthCycle?: CycleState;
  [key: string]: unknown;
}

export interface ModEntry {
  name: string;
  uniqueName: string;
  imageName?: string;
  description?: string;
  polarity?: string;
  rarity?: string;
  type?: string;
  baseDrain?: number;
  fusionLimit?: number;
  compatName?: string;
  isAugment?: boolean;
  wikiaUrl?: string;
}
