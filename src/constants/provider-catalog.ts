import deepseekLogo from '../assets/provider-icons/deepseek.svg'
import doubaoLogo from '../assets/provider-icons/doubao.svg'
import hunyuanLogo from '../assets/provider-icons/hunyuan.svg'
import minimaxLogo from '../assets/provider-icons/minimax.svg'
import moonshotLogo from '../assets/provider-icons/moonshot.svg'
import openaiLogo from '../assets/provider-icons/openai.svg'
import siliconflowLogo from '../assets/provider-icons/siliconflow.svg'
import stepfunLogo from '../assets/provider-icons/stepfun.svg'
import xiaomimimoLogo from '../assets/provider-icons/xiaomimimo.svg'
import zhipuLogo from '../assets/provider-icons/zhipu.svg'
import { LLMProviderPresetType } from '../types/provider.types'

// Picker categories from the V1-grid design. `custom` is rendered as a
// dedicated last tile, not as part of any category list.
export type ProviderPickerCategory = 'main' | 'cn'

export type ProviderTint =
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'rose'
  | 'amber'
  | 'orange'
  | 'teal'
  | 'green'
  | 'pink'
  | 'slate'
  | 'ink'

export type ProviderCatalogEntry = {
  /** Used when `logo` is undefined or the user prefers monogram mode. */
  monogram: string
  /** Drives the monogram tile colour AND the subtle ring on logo tiles. */
  tint: ProviderTint
  category: ProviderPickerCategory
  /** OAuth flow rather than API-key auth — surfaced as a badge. */
  oauth?: boolean
  /** Inlined brand logo (data-URL via esbuild). Falls back to monogram. */
  logo?: string
}

// Keyed by `LLMProviderPresetType`, minus `openai-compatible` which is rendered
// as the dedicated "custom" tile. Using `Record<Exclude<...>>` forces TS to
// surface any new preset that has not been catalogued here.
export const PROVIDER_CATALOG: Record<
  Exclude<LLMProviderPresetType, 'openai-compatible'>,
  ProviderCatalogEntry
> = {
  openai: {
    monogram: 'OA',
    tint: 'green',
    category: 'main',
    logo: openaiLogo,
  },
  'chatgpt-oauth': {
    monogram: 'GPT',
    tint: 'green',
    category: 'main',
    oauth: true,
    logo: openaiLogo,
  },
  deepseek: {
    monogram: '深度',
    tint: 'blue',
    category: 'cn',
    logo: deepseekLogo,
  },
  moonshot: {
    monogram: 'Ki',
    tint: 'purple',
    category: 'cn',
    logo: moonshotLogo,
  },
  zhipu: {
    monogram: '智谱',
    tint: 'indigo',
    category: 'cn',
    logo: zhipuLogo,
  },
  doubao: {
    monogram: '豆包',
    tint: 'rose',
    category: 'cn',
    logo: doubaoLogo,
  },
  siliconflow: {
    monogram: '硅基',
    tint: 'blue',
    category: 'cn',
    logo: siliconflowLogo,
  },
  stepfun: {
    monogram: '阶跃',
    tint: 'purple',
    category: 'cn',
    logo: stepfunLogo,
  },
  minimax: {
    monogram: 'MM',
    tint: 'pink',
    category: 'cn',
    logo: minimaxLogo,
  },
  hunyuan: {
    monogram: '混元',
    tint: 'teal',
    category: 'cn',
    logo: hunyuanLogo,
  },
  xiaomimimo: {
    monogram: 'MiMo',
    tint: 'orange',
    category: 'cn',
    logo: xiaomimimoLogo,
  },
}

// Sort order inside each category (and across the flat list when category=all).
// Matches the visual priority in the design (mainstream first, then CN, etc.).
const FLAT_ORDER: Exclude<LLMProviderPresetType, 'openai-compatible'>[] = [
  'openai',
  'chatgpt-oauth',
  'deepseek',
  'moonshot',
  'zhipu',
  'doubao',
  'siliconflow',
  'stepfun',
  'minimax',
  'hunyuan',
  'xiaomimimo',
]

export const PROVIDER_PICKER_ORDER = FLAT_ORDER

export const PROVIDER_PICKER_CATEGORIES: {
  id: 'all' | ProviderPickerCategory
  labelKey: string
  fallback: string
}[] = [
  { id: 'all', labelKey: 'categoryAll', fallback: 'All' },
  { id: 'main', labelKey: 'categoryMain', fallback: 'International' },
  { id: 'cn', labelKey: 'categoryCn', fallback: 'China' },
]
