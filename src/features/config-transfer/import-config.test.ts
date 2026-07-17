import { parseYoloSettings } from '../../settings/schema/settings'
import { SETTINGS_SCHEMA_VERSION } from '../../settings/schema/version'

import { computeChecksum } from './export-config'
import {
  ImportValidationError,
  applyImport,
  parseVaultData,
  validateExportFile,
} from './import-config'
import { ConfigExportFile } from './types'

function makeExport(
  overrides: Partial<ConfigExportFile> = {},
): ConfigExportFile {
  return {
    $schema: 'yolo-config-export',
    formatVersion: 1,
    settingsVersion: SETTINGS_SCHEMA_VERSION,
    exportedAt: '2026-07-17T00:00:00.000Z',
    pluginVersion: '1.6.0.3',
    redacted: false,
    keys: ['systemPrompt'],
    data: { systemPrompt: 'Imported prompt' },
    checksum: '',
    ...overrides,
  }
}

describe('config import', () => {
  it('validates a current-version export with a matching checksum', async () => {
    const file = makeExport()
    const { checksum: _checksum, ...payload } = file
    const result = await validateExportFile({
      ...file,
      checksum: await computeChecksum(JSON.stringify(payload)),
    })

    expect(result.valid).toBe(true)
  })

  it('rejects settings from any other schema version', async () => {
    const exportResult = await validateExportFile(
      makeExport({ settingsVersion: SETTINGS_SCHEMA_VERSION + 1 }),
    )
    expect(exportResult.valid).toBe(false)

    const vaultResult = parseVaultData({
      ...parseYoloSettings({ version: SETTINGS_SCHEMA_VERSION }),
      version: SETTINGS_SCHEMA_VERSION + 1,
    })
    expect(vaultResult.valid).toBe(false)
  })

  it('only exposes current exportable settings from vault data', () => {
    const result = parseVaultData({
      ...parseYoloSettings({ version: SETTINGS_SCHEMA_VERSION }),
      removedLegacyField: true,
    })

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.keys).not.toContain('removedLegacyField')
      expect(result.data.keys).not.toContain('version')
    }
  })

  it('applies selected current-schema fields', () => {
    const current = parseYoloSettings({ version: SETTINGS_SCHEMA_VERSION })
    const result = applyImport({
      importData: makeExport(),
      selectedKeys: ['systemPrompt'],
      currentSettings: current,
      mergeStrategy: 'overwrite',
    })

    expect(result.systemPrompt).toBe('Imported prompt')
  })

  it('refuses to apply a mismatched schema version', () => {
    const current = parseYoloSettings({ version: SETTINGS_SCHEMA_VERSION })
    expect(() =>
      applyImport({
        importData: makeExport({
          settingsVersion: SETTINGS_SCHEMA_VERSION + 1,
        }),
        selectedKeys: ['systemPrompt'],
        currentSettings: current,
        mergeStrategy: 'overwrite',
      }),
    ).toThrow(ImportValidationError)
  })
})
