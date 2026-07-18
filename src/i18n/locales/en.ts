import type { TranslationKeys } from '../types'

export const en: TranslationKeys = {
  commands: {
    openChatSidebar: 'Open chat (sidebar)',
    newChatCurrentView: 'New chat',
    openYoloNewChat: 'YOLO-Lite: Open chat window',
    openNewChatTab: 'Open new chat (new tab)',
    openNewChatSplit: 'Open new chat (right split)',
    openNewChatWindow: 'Open new chat (new window)',
    addFileToChat: 'Add file to chat',
    addFolderToChat: 'Add folder to chat',
    exportSettings: 'Export plugin settings',
    importSettings: 'Import plugin settings',
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    adding: 'Adding...',
    clear: 'Clear',
    remove: 'Remove',
    confirm: 'Confirm',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    retry: 'Retry',
    copy: 'Copy',
    paste: 'Paste',
    characters: 'Chars',
    words: 'Words',
    wordsCharacters: 'Words/characters',
    rows: 'rows',
    columns: 'columns',
    default: 'Default',
    modelDefault: 'Model default',
    on: 'On',
    off: 'Off',
    noResults: 'No matches found',
    configure: 'Configure',
  },

  sidebar: {
    tabs: {
      chat: 'Chat',
      agent: 'Agent',
    },
    chatList: {
      searchPlaceholder: 'Search conversations',
      empty: 'No conversations',
      myConversations: 'My conversations',
      current: 'Current',
      pinConversation: 'Pin',
      unpinConversation: 'Unpin',
      retryTitle: 'Retry title',
      archived: 'Archived',
      hideArchived: 'Hide archived',
      exportConversation: 'Export conversation to vault',
      moreActions: 'More actions',
    },
    chat: {
      exportSuccess: 'Exported chat to {path}',
      exportError: 'Could not export conversation',
    },
  },

  settings: {
    title: 'YOLO-Lite settings',
    tabs: {
      models: 'Models',
      agent: 'Agent',
      others: 'Others',
    },
    supportYolo: {
      name: 'YOLO-Lite project',
      desc: 'Report issues or suggest features on GitHub.',
      reportBug: 'Report Bug',
      featureRequest: 'Feature Request',
    },
    defaults: {
      title: 'Default model policies & prompts',
      defaultChatModel: 'Default chat model',
      defaultChatModelDesc:
        'Choose the model you want to use for sidebar chat.',
      chatTitleModel: 'Conversation title model',
      chatTitleModelDesc:
        'Choose the model used for automatic conversation naming.',
      streamFallbackRecovery: 'Enable automatic recovery',
      streamFallbackRecoveryDesc:
        'When the streaming primary request times out or fails, retry once with a non-streaming fallback.',
      primaryRequestTimeout: 'Primary request timeout (seconds)',
      primaryRequestTimeoutDesc:
        'How long to wait before the streaming primary request is treated as timed out. This timeout always applies; if automatic recovery is enabled, a non-streaming fallback is attempted afterward. Default: 60 seconds.',
      globalSystemPrompt: 'Global system prompt',
      globalSystemPromptDesc:
        'This prompt is added to the beginning of every chat conversation.',
      chatTitlePrompt: 'Chat title prompt',
      chatTitlePromptDesc:
        'Prompt used when automatically generating conversation titles from the first user message.',
    },
    chatPreferences: {
      title: 'Chat preferences',
      chatFontScale: 'Chat UI scale',
      chatFontScaleDesc:
        'Adjust the overall scale of the chat interface (default 100%).',
    },
    assistants: {
      title: 'Assistants',
      desc: 'Create and manage custom AI assistants',
      configureAssistants: 'Configure assistants',
      assistantsCount: 'Configured {count} assistants',
      addAssistant: 'Add assistant',
      editAssistant: 'Edit assistant',
      deleteAssistant: 'Delete assistant',
      name: 'Name',
      description: 'Description',
      systemPrompt: 'System prompt',
      systemPromptDesc:
        'This prompt will be added to the beginning of every chat.',
      systemPromptPlaceholder:
        "Enter system prompt to define assistant's behavior and capabilities",
      namePlaceholder: 'Enter assistant name',
      defaultAssistantName: 'New assistant',
      deleteConfirmTitle: 'Confirm delete assistant',
      deleteConfirmMessagePrefix: 'Are you sure you want to delete assistant',
      deleteConfirmMessageSuffix: ' This action cannot be undone.',
      addAssistantAria: 'Add new assistant',
      deleteAssistantAria: 'Delete assistant',
      actions: 'Actions',
      noAssistants: 'No assistants available',
      noAssistant: 'Default',
      selectAssistant: 'Select assistant',
      duplicate: 'Duplicate',
      manageAll: 'Manage all…',
    },
    agent: {
      title: 'Agent',
      desc: 'Manage global tool availability. Enabled tools become selectable by agents; actual use must still be enabled in each agent.',
      globalCapabilities: 'Global capabilities',
      tools: 'Tools',
      toolsCount: '{count} tools',
      toolsCountWithEnabled: '{count} tools (enabled {enabled})',
      skills: 'Skills',
      skillsCount: '{count} skills',
      skillsCountWithEnabled: '{count} skills (enabled {enabled})',
      skillsGlobalDesc:
        'Skills are discovered from built-in skills and {path}/**/*.md (excluding Skills.md where applicable). Disable a skill here to block it for all agents.',
      yoloBaseDir: 'Plugin data folder',
      yoloBaseDirDesc:
        'Enter a vault-relative path (without a leading /). Example: use YOLO at vault root, or setting/YOLO under the setting folder.',
      yoloBaseDirPlaceholder: 'YOLO',
      skillsSourcePath:
        'Source: built-in skills + {path}/*.md + {path}/**/SKILL.md',
      refreshSkills: 'Refresh',
      skillsEmptyHint:
        'No skills found. Create skill markdown files under {path}.',
      createSkillTemplates: 'Initialize Skills system',
      skillsTemplateCreated: 'Skills system initialized in {path}.',
      importSkill: 'Import Skill',
      importSkillDesc:
        'Import skill packages into {path}. Supports single .md files or Agent Skills standard folders.',
      importSkillDropzoneText: 'Drag & drop skill files or folders here',
      importSkillBrowseFiles: 'Browse Files',
      importSkillBrowseFolder: 'Browse Folder',
      importSkillFileCount: '{count} skill(s) selected ({files} files total)',
      importSkillFilesInPackage: 'file(s)',
      importSkillRemoveFile: 'Remove',
      importSkillConfirm: 'Import',
      importSkillSuccess: 'Successfully imported {count} skill(s).',
      importSkillInvalidFile: 'No valid skill files or packages found.',
      importSkillReadError: 'Failed to read files.',
      importSkillWriteError: 'Failed to import {name}: {error}',
      importSkillErrHeader: '"{name}" cannot be imported:',
      importSkillErrNoSkillMd: 'missing SKILL.md file in folder',
      importSkillErrNoFrontmatter:
        'missing metadata header (---) at the top of the file',
      importSkillErrNoName: 'missing "name" field in metadata',
      importSkillErrNameTooLong: '"name" is too long (max 64 characters)',
      importSkillErrNameUppercase: '"name" must be all lowercase',
      importSkillErrNameHyphenEdge: '"name" cannot start or end with a hyphen',
      importSkillErrNameDoubleHyphen:
        '"name" cannot contain consecutive hyphens (--)',
      importSkillErrNameInvalidChars:
        '"name" can only contain lowercase letters, numbers, and hyphens',
      importSkillErrNameMismatch: '"name" must match the folder name',
      importSkillErrNoDescription: 'missing "description" field in metadata',
      importSkillErrDescTooLong:
        '"description" is too long (max 1024 characters)',
      importSkillErrCompatTooLong:
        '"compatibility" is too long (max 500 characters)',
      importSkillConflictTitle: 'Skill already exists',
      importSkillConflictMessage:
        'A skill with the same name already exists. Do you want to overwrite it?',
      importSkillConflictOverwrite: 'Overwrite all',
      importSkillConflictMessageList:
        'The following skill(s) already exist: {names}\n\nClick "Overwrite all" to replace them, "Skip conflicts" to keep them, or close this dialog to cancel the import.',
      importSkillConflictSkip: 'Skip conflicts',
      importSkillUnsafePath: 'Refused unsafe path in "{name}": {path}',
      importSkillDuplicateInBatch:
        'Duplicate skill name in this batch: "{name}" (from "{source}"). Only the first occurrence is kept.',
      importSkillFromUrlPlaceholder: 'Paste a GitHub URL (repo / blob / tree)',
      importSkillFromUrlFetch: 'Fetch',
      importSkillFromUrlFetching: 'Fetching...',
      importSkillImporting: 'Importing...',
      importSkillFromUrlInvalid:
        'Please enter a valid GitHub URL (repo / blob / tree).',
      importSkillFromUrlNotFound:
        'Resource not found on GitHub. Check the URL and that the repository / file exists and is public.',
      importSkillFromUrlRateLimit:
        'GitHub API rate limit exceeded. Please try again later.',
      importSkillFromUrlTooLarge: 'Skill package exceeds size limit: {error}',
      importSkillFromUrlFetchError: 'Failed to fetch from GitHub: {error}',
      deleteSkillTitle: 'Delete skill',
      deleteSkillMessage:
        'Are you sure you want to delete "{name}"? This cannot be undone.',
      deleteSkillConfirm: 'Delete',
      deleteSkillSuccess: '"{name}" has been deleted.',
      deleteSkillError: 'Failed to delete "{name}": {error}',
      deleteSkillBatchMessage:
        'Are you sure you want to delete {count} skill(s)? This cannot be undone.',
      deleteSkillBatchSuccess: 'Deleted {count} skill(s).',
      deleteSkillBatchBtn: 'Delete',
      deleteSkillSelectAll: 'Select all',
      deleteSkillCancel: 'Cancel',
      selectSkills: 'Select',
      agents: 'Agents',
      agentsDesc: 'Click Configure to edit each agent profile and prompt.',
      configureAgents: 'Configure',
      noAgents: 'No agents configured yet',
      newAgent: 'New agent',
      current: 'Current',
      duplicate: 'Duplicate',
      copySuffix: ' (copy)',
      deleteConfirmTitle: 'Confirm delete agent',
      deleteConfirmMessagePrefix: 'Are you sure you want to delete agent',
      deleteConfirmMessageSuffix: '? This action cannot be undone.',
      toolSourceBuiltin: 'Built-in',
      toolsGroupBuiltinVault: 'Vault',
      toolsGroupBuiltinContext: 'Context & Memory',
      toolsGroupBuiltinExternal: 'External',
      noToolDefinitions: 'No built-in tools available',
      toolsEnabledCount: '{count} enabled',
      manageTools: 'Manage tools',
      manageSkills: 'Manage skills',
      expandDescription: 'Expand',
      collapseDescription: 'Collapse',
      viewAllTools: 'View all tools',
      viewAllSkills: 'View all skills',
      enableAllTools: 'Enable all',
      disableAllTools: 'Disable all',
      descriptionColumn: 'Description',
      builtinFsListLabel: 'Read Vault',
      builtinFsListDesc: 'List vault directory structure',
      builtinFsSearchLabel: 'Search Vault',
      builtinFsSearchDesc: 'Search vault files and content',
      builtinFsReadLabel: 'Read',
      builtinFsReadDesc:
        'Read vault files, skills, or open web pages (browser://)',
      builtinContextPruneToolResultsLabel: 'Prune Tool Results',
      builtinContextPruneToolResultsDesc:
        'Exclude past tool results from future context. Note: this tool may break the prompt cache and increase request cost.',
      builtinContextCompactLabel: 'Compact Context',
      builtinContextCompactDesc: 'Compress earlier conversation into a summary',
      builtinFsEditLabel: 'Text Editing',
      builtinFsEditDesc: 'Edit text in a single file',
      safetyControls: 'Safety Controls',
      safetyControlsDesc:
        'Configure extra review behavior before agents perform risky file operations.',
      fsEditReviewToggle: 'Require approval before editing files',
      fsEditReviewToggleDesc:
        'When enabled, agent fs_edit changes open inline/apply review before writing the file.',
      builtinFsEditOpsLabel: 'File Editing Toolset',
      builtinFsEditOpsDesc: 'Edit targeted text or write full file content',
      builtinFsFileOpsLabel: 'Path Operation Toolset',
      builtinFsFileOpsDesc:
        'Delete or move files and folders, and create folders',
      builtinMemoryOpsLabel: 'Memory Toolset',
      builtinMemoryOpsDesc: 'Add, update, and delete memory',
      builtinMemoryAddLabel: 'Add Memory',
      builtinMemoryAddDesc:
        'Add one memory item into global or assistant memory and auto-assign an id.',
      builtinMemoryUpdateLabel: 'Update Memory',
      builtinMemoryUpdateDesc: 'Update an existing memory item by id.',
      builtinMemoryDeleteLabel: 'Delete Memory',
      builtinMemoryDeleteDesc: 'Delete an existing memory item by id.',
      builtinOpenSkillLabel: 'Open Skill',
      builtinOpenSkillDesc: 'Load a skill markdown',
      builtinWebSearchLabel: 'Web Search',
      builtinWebSearchDesc:
        'Search the web through a configured search provider and return ranked results with snippets.',
      builtinWebScrapeLabel: 'Web Scrape',
      builtinWebScrapeDesc:
        'Fetch the full content of a single URL through a configured search provider.',
      builtinWebOpsLabel: 'Web Search Toolset',
      builtinWebOpsDesc: 'Web search and page scraping',
      builtinJsEvalLabel: 'JavaScript Execution',
      builtinJsEvalDesc: 'Run JavaScript in an isolated environment.',
      builtinTerminalCommandLabel: 'Terminal Commands',
      builtinTerminalCommandDesc:
        'Run commands in the local terminal. Desktop-only.',
      builtinDelegateSubagentLabel: 'Delegate Subagent',
      builtinDelegateSubagentDesc:
        'Dispatch an isolated temporary subagent to complete a self-contained task asynchronously.',
      builtinTodoWriteLabel: 'Task List',
      builtinTodoWriteDesc:
        'Let the agent plan and track multi-step task progress autonomously. Agent mode only.',
      builtinAskUserQuestionLabel: 'Ask User',
      builtinAskUserQuestionDesc:
        'Ask the user a question when required information is missing, then resume after the answer.',
      editorDefaultName: 'New agent',
      editorIntro: "Configure this agent's capabilities, model, and behavior.",
      editorTabProfile: 'Profile',
      editorTabTools: 'Tools',
      editorTabSkills: 'Skills',
      editorTabWorkspace: 'Workspace',
      workspace: {
        enableTitle: 'Restrict directory access',
        enableDesc:
          'When off, this agent can access the entire vault. When on, only the rules below apply.',
        includeTitle: 'Allow',
        includeDesc: 'Only read/write files under these paths',
        includeBadge: 'INCLUDE',
        includeEmpty:
          'Leave empty to allow everything except the exclude list below.',
        excludeTitle: 'Deny',
        excludeDesc: 'Excluded from the allow range (higher priority)',
        excludeBadge: 'EXCLUDE',
        excludeEmpty: 'No exclusions.',
      },
      editorTabModel: 'Model',
      editorName: 'Name',
      editorNameDesc: 'Agent display name',
      editorDescription: 'Description',
      editorDescriptionDesc: 'Short summary for this agent',
      editorIcon: 'Icon',
      editorIconDesc: 'Pick an icon for this agent',
      editorChooseIcon: 'Choose icon',
      editorSystemPrompt: 'System prompt',
      editorSystemPromptDesc: 'Primary behavior instruction for this agent.',
      editorSystemPromptExpand: 'Expand editor',
      editorSystemPromptCollapse: 'Close expanded editor',
      editorEnableProjectInstructions: 'Load project instruction files',
      editorEnableProjectInstructionsDesc:
        'Auto-load AGENTS.md and CLAUDE.md from the vault root for this agent. Compatible with Codex / Claude Code / Cursor and similar tools.',
      editorEnableTools: 'Enable tools',
      editorEnableToolsDesc: 'Allow this agent to call tools',
      editorIncludeBuiltinTools: 'Include built-in tools',
      editorIncludeBuiltinToolsDesc:
        'Allow local vault file tools for this agent',
      toolApproval: 'Approval',
      toolApprovalFullAccess: 'Full access',
      toolApprovalRequire: 'Require approval',
      toolDisclosureAuto: 'Auto',
      toolDisclosureAutoSelect: 'Auto select',
      toolDisclosureAlways: 'In context',
      toolDisclosureMixed: 'Mixed',
      toolDisclosureOnDemand: 'On demand',
      editorEnabled: 'Enabled',
      editorDisabled: 'Disabled',
      editorModel: 'Model',
      editorModelDesc: 'Select the model used by this agent',
      editorModelCurrent: 'Current: {model}',
      editorModelSampling: 'Sampling parameters',
      editorModelResetDefaults: 'Restore defaults',
      modelPresetFocused: 'Focused',
      modelPresetBalanced: 'Balanced',
      modelPresetCreative: 'Creative',
      editorTemperature: 'Temperature',
      editorTemperatureDesc: '0.0 - 2.0',
      editorTopP: 'Top P',
      editorTopPDesc: '0.0 - 1.0',
      editorMaxOutputTokens: 'Max output tokens',
      editorMaxOutputTokensDesc: 'Maximum generated tokens',
      editorMaxContextMessages: 'Max context messages',
      editorCustomParameters: 'Custom parameters',
      editorCustomParametersDesc:
        'Additional request fields for this agent. Same keys override model-level parameters',
      editorCustomParametersAdd: 'Add parameter',
      editorCustomParametersKeyPlaceholder: 'Key',
      editorCustomParametersValuePlaceholder: 'Value',
      editorToolsCount: '{count} tools',
      editorEstimatedContextTokens: '~{count} tokens',
      editorSkillsCount: '{count} skills',
      editorSkillsCountWithEnabled: '{count} skills (enabled {enabled})',
      skillLoadAlways: 'Full inject',
      skillLoadLazy: 'On demand',
      skillDisabledGlobally: 'Disabled globally',
      agentCapabilitiesBlockTitle: 'Agent capabilities',
      focusSyncTitle: 'Focus sync',
      focusSyncDesc:
        'When enabled, the AI can sense where you are in the note or web page you are viewing. Full web page content is read via fs_read with a browser:// path.',
      timeContextTitle: 'Current time awareness',
      timeContextDesc:
        'Lets the model know the current time when each message is sent.',
      imageReadingBlockTitle: 'Image reading',
      imageReadingEnabled: 'Image reading',
      imageReadingEnabledDesc:
        'Automatically extract embedded images when reading Markdown files, sending them to the model as multimodal content.',
      externalImageFetchEnabled: 'Fetch external image URLs',
      externalImageFetchEnabledDesc:
        'Also fetch http(s) image URLs referenced in Markdown (image hosts, CDNs). Disabled by default — enabling it will send outbound requests to third-party hosts. Fetches time out after 5s and skip images larger than 10MB.',
      imageCompressionEnabled: 'Image compression',
      imageCompressionEnabledDesc:
        'Compress extracted images to reduce token usage and transfer size.',
      imageCompressionQuality: 'Compression quality',
      imageCompressionQualityDesc:
        'Image compression ratio (1-100). Controls both dimensions and quality, e.g. 60 scales to 60% size at 60% quality.',
      autoContextCompactionBlockTitle: 'Context compaction',
      autoContextCompaction: 'Automatic context compaction',
      autoContextCompactionDesc:
        'When the context reaches the threshold, remind the Agent to run the context compaction command.',
      autoContextCompactionThresholdMode: 'Compaction threshold mode',
      autoContextCompactionModeTokens: 'Absolute prompt tokens',
      autoContextCompactionModeRatio: 'Fraction of context window',
      autoContextCompactionThresholdTokens: 'Prompt token threshold',
      autoContextCompactionThresholdTokensDesc:
        "Trigger when the last reply's reported prompt_tokens is at least this value.",
      autoContextCompactionThresholdRatioPercent: 'Context window usage (%)',
      autoContextCompactionThresholdRatioPercentDesc:
        "Trigger when prompt_tokens divided by the chat model's max context window reaches this percentage. Requires max context tokens on the model.",
      jsSandboxExtTitle: 'Extension capabilities',
      jsSandboxAllowFetch: 'Allow Network Fetch',
      jsSandboxAllowFetchDesc:
        'Allow browser network requests, plus a separate $fetch helper for requests that need YOLO-Lite to bypass cross-origin limits. Also enabled automatically when external scripts are enabled.',
      jsSandboxAllowFetchRisk:
        'Risk: scripts can reach any URL the browser can — public APIs, your local network, internal services, and the LLM provider itself. Data in the script (including vault contents you pass in) can be exfiltrated. Only enable for agents you fully trust.',
      jsSandboxAllowFetchConfirm:
        'Enabling network requests lets scripts contact browser-accessible addresses and use a separate YOLO-Lite host request helper when browser cross-origin limits block a response. Only enable this for an agent you trust. Continue?',
      jsSandboxAllowVaultRead: 'Allow Vault Read',
      jsSandboxAllowVaultReadDesc:
        'Let scripts list vault paths and read any vault file by path. This capability is not constrained by the agent directory scope. Risk: scripts could pass note contents to external services.',
      jsSandboxAllowVaultReadConfirm:
        "Enabling vault read lets AI-generated scripts list vault paths and read any file in the vault by path. This data passes through the LLM context. Only enable if you trust this agent's scripts. Continue?",
      jsSandboxAllowBrowserRead: 'Allow Open Web Page Read',
      jsSandboxAllowBrowserReadDesc:
        'Let scripts read the full HTML of web pages already open in Obsidian by page ID. This can include logged-in or private page content.',
      jsSandboxAllowBrowserReadRisk:
        'Risk: scripts can read the full page DOM from pages you have opened in Obsidian, including hidden fields, embedded state, and private or logged-in content. Only enable for agents you fully trust.',
      jsSandboxAllowBrowserReadConfirm:
        'Enabling open web page read lets AI-generated scripts read full HTML from web pages already open in Obsidian by page ID. This content passes through the LLM context. Continue?',
      jsSandboxBrowserReadMaxKb: 'Max page HTML size (KB)',
      jsSandboxBrowserReadMaxKbDesc:
        'Per-call full HTML limit. Larger pages are refused instead of shortened. Range 1–1048576 KB. Leave blank to use the default.',
      jsSandboxAllowExternalScripts: 'Allow External Scripts',
      jsSandboxAllowExternalScriptsDesc:
        'Allow scripts to load and run remote JavaScript, and open the broader browser capabilities needed by those scripts.',
      jsSandboxAllowExternalScriptsRisk:
        'EXTREME RISK: the agent can pull in and execute arbitrary remote JavaScript with the same privileges as your browser tab. This is functionally equivalent to running untrusted code from the internet. Anything in the vault that you pass into a script can be exfiltrated. Only enable for agents and code sources you fully trust.',
      jsSandboxAllowExternalScriptsConfirm:
        'Enabling external scripts lets the agent load and run remote JavaScript inside Obsidian. This is powerful and risky: only continue if you fully trust this agent and the code source.',
      jsSandboxConfirmEnableTitle: 'Enable extension capability',
      jsSandboxTimeoutMs: 'Execution timeout (ms)',
      jsSandboxTimeoutMsDesc:
        'Maximum runtime for a single script call. Range {min}–{max}.',
      jsSandboxOutputMaxKb: 'Max tool result size (KB)',
      jsSandboxOutputMaxKbDesc:
        'Upper bound on the JSON result returned to the model. Larger output is truncated to a prefix. Oversized responses consume model context tokens and can exceed the context window, driving up cost. Range {min}–{max} KB.',
      jsSandboxVaultReadMaxKb: 'Max read size (KB)',
      jsSandboxVaultReadMaxKbDesc:
        'Per-call read limit. Larger text is shortened with a notice; larger binary files are refused. Range {min}–{max} KB.',
    },
    jsSandbox: {
      openSettings: 'Configure JavaScript execution',
    },
    terminalCommand: {
      openSettings: 'Configure terminal command',
      blockedPrefixes: 'Blocked command prefixes',
      blockedPrefixesDesc:
        'Commands matching these prefixes will be rejected before execution.',
      matchingRule:
        'Prefix matching uses the first command token: rm blocks rm -rf /, but not npm run build.',
      addPrefixPlaceholder: 'Command prefix, e.g. rm',
      resetDefaults: 'Reset to defaults',
    },
    subagent: {
      openSettings: 'Configure subagent models',
      modelPool: 'Subagent model pool',
      modelPoolDesc:
        'The parent agent can dispatch subagents only with models in this pool.',
      preferredModelRule:
        'If the parent agent does not pass modelId explicitly, the preferred model is used.',
      addModelsTitle: 'Add subagent models',
      addModelsDesc:
        'Select registered chat models to add to the subagent model pool.',
      addModelPlaceholder: 'Select a model',
      addModel: 'Add model',
      addSelectedModels: 'Add selected models',
      searchModels: 'Search models...',
      setPreferredModel: 'Set as preferred model',
      defaultModel: 'Default',
      setDefaultModel: 'Set default',
      emptyModelPool: 'No subagent models selected.',
      poolCount: '{count} models',
    },
    webSearch: {
      modalTitle: 'Web search settings',
      openSettings: 'Configure web search providers',
      intro:
        'Configure search providers used by the built-in web_search agent tool. The default provider below is used when the agent invokes web_search.',
      providersHeader: 'Providers',
      addProvider: 'Add provider',
      editProvider: 'Edit provider',
      empty:
        'No providers configured yet. Add one to enable the web_search tool.',
      colName: 'Name',
      colType: 'Type',
      colDefault: 'Default',
      colActions: 'Actions',
      deleteConfirmTitle: 'Delete provider',
      deleteConfirmMessage:
        'Are you sure you want to delete this web search provider?',
      deleteFailed: 'Failed to delete provider.',
      commonHeader: 'Common',
      resultSize: 'Result size',
      resultSizeDesc:
        'Maximum number of results returned to the model per search.',
      searchTimeout: 'Search timeout (ms)',
      scrapeTimeout: 'Scrape timeout (ms)',
      searchTimeoutLabel: 'Search timeout',
      searchTimeoutDesc: 'Maximum wait time for a provider search call.',
      scrapeTimeoutLabel: 'Scrape timeout',
      scrapeTimeoutDesc: 'Maximum wait time for a single web_scrape call.',
      unitResults: 'items',
      tagDefault: 'Default',
      failoverNotice:
        'Failed calls are not silently retried against another provider — the error is surfaced to the model so the agent can decide to retry or change approach.',
      providerCount: 'Total providers',
      types: {
        tavily: 'Tavily',
        jina: 'Jina',
        searxng: 'SearXNG',
        bing: 'Bing (no key)',
        zhipu: 'Zhipu Web Search',
      },
      fieldName: 'Display name',
      fieldApiKey: 'API key',
      fieldDepth: 'Depth',
      fieldSearchUrl: 'Search URL',
      fieldScrapeUrl: 'Scrape URL',
      fieldUseProviderScrapeApi: 'Use provider scrape API',
      fieldUseProviderScrapeApiDesc:
        'When enabled, web_scrape uses this provider\u2019s extract API. When disabled, web_scrape uses the built-in generic scraper (static HTML, no extra API usage).',
      fieldBaseUrl: 'Base URL',
      fieldLanguage: 'Language',
      fieldEngines: 'Engines (comma-separated)',
      fieldUsername: 'Basic auth username',
      fieldPassword: 'Basic auth password',
      fieldZhipuEngine: 'Search engine',
      fieldZhipuContentSize: 'Content size',
      fieldZhipuRecency: 'Recency filter',
      fieldZhipuDomainFilter: 'Domain filter (optional)',
      bingNote:
        'Bing requires no API key. The provider scrapes the public results page; reliability depends on Bing\u2019s anti-bot measures.',
    },
    providers: {
      title: 'Providers',
      desc: 'Enter your API keys for the providers you want to use',
      howToGetApiKeys: 'How to obtain API keys',
      addProvider: 'Add provider',
      pickerTitle: 'Add provider',
      pickerSearchPlaceholder: 'Search providers · press Enter',
      pickerCustomLabel: 'Custom provider',
      pickerCustomDesc: 'Manually enter base URL and API key',
      pickerEmpty: 'No matching providers',
      categoryAll: 'All',
      categoryMain: 'International',
      categoryCn: 'China',
      badgeOpenAiCompatible: 'OpenAI compatible',
      badgeOAuth: 'OAuth',
      badgeAdded: 'Added',
      kind: {
        openai: 'Reasoning · Multimodal',
        chatgptOAuth: 'ChatGPT Plus / Pro',
        deepseek: 'Chat · Reasoning',
        moonshot: 'Long context',
      },
      providersCount: '{count} providers added',
      editProvider: 'Edit provider',
      deleteProvider: 'Delete provider',
      deleteConfirm: 'Are you sure you want to delete provider',
      deleteWarning: 'This will also delete',
      requestDelete: 'Delete provider',
      deleteConfirmTitle: 'Delete provider "{provider}"?',
      deleteConfirmImpact: 'This also removes {chatCount} chat models.',
      confirmDeleteAction: 'Confirm delete',
      chatModels: 'chats',
      editProviderTitle: 'Edit provider',
      providerId: 'ID',
      providerIdDesc:
        'Choose an ID to identify this provider in your settings. This is just for your reference.',
      providerIdPlaceholder: 'Example: my-custom-provider',
      apiKey: 'API key',
      apiKeyDesc: 'Leave empty if not required.',
      apiKeyPlaceholder: 'Enter your API key',
      baseUrl: 'Base URL',
      baseUrlDesc:
        'API endpoint for third-party services, e.g.: https://api.example.com/v1 or https://your-proxy.com/openai (Leave empty to use default)',
      baseUrlPlaceholder: 'https://api.example.com/v1',
      apiUrlPreviewLabel: 'Preview:',
      noStainlessHeaders: 'No stainless headers',
      noStainlessHeadersDesc:
        'Enable this if you encounter cross-origin errors related to stainless headers.',
      requestTransportMode: 'Network request method',
      requestTransportModeDesc:
        'Choose how this provider sends network requests on this device. Desktop direct connection is recommended on desktop. On mobile, switch to Obsidian built-in request if browser requests have streaming or network issues.',
      requestTransportModeAuto: 'Auto (recommended)',
      requestTransportModeBrowser: 'Browser request',
      requestTransportModeObsidian: 'Obsidian built-in request',
      requestTransportModeNode: 'Desktop direct connection (recommended)',
      responseStreamingMode: 'Response streaming mode',
      responseStreamingModeDesc:
        'Control whether this provider uses streaming or non-streaming responses.',
      responseStreamingModeAuto: 'Auto (default)',
      responseStreamingModeStreaming: 'Streaming',
      responseStreamingModeNonStreaming: 'Non-streaming',
      customHeaders: 'Custom headers',
      customHeadersDesc:
        'Attach extra HTTP headers to all requests sent through this provider.',
      customHeadersAdd: 'Add header',
      customHeadersKeyPlaceholder: 'Header name',
      customHeadersValuePlaceholder: 'Header value',
      chatgptOAuthTitle: 'ChatGPT OAuth',
      chatgptOAuthConnect: 'Connect',
      chatgptOAuthDisconnect: 'Disconnect',
      chatgptOAuthConnecting: 'Connecting...',
      chatgptOAuthLoadingStatus: 'Loading ChatGPT OAuth status...',
      chatgptOAuthConnected: 'Connected',
      chatgptOAuthExpires: 'expires',
      chatgptOAuthDisconnectedHelp:
        'Not connected. Connect to use models from your ChatGPT Plus / Pro account.',
      chatgptOAuthStreamingNotice:
        'ChatGPT OAuth supports streaming. Obsidian requestUrl buffers the response, while desktop Node fetch can stream it in real time.',
      chatgptOAuthPendingCode: 'Current device code:',
      oauthDesktopOnly:
        'OAuth login is only available on desktop. Please connect on desktop first.',
    },
    models: {
      title: 'Models',
      chatModels: 'Chat models',
      addChatModel: 'Add chat model',
      addCustomChatModel: 'Add custom chat model',
      editChatModel: 'Edit chat model',
      editCustomChatModel: 'Edit custom chat model',
      modelId: 'Model ID',
      modelIdDesc:
        'API model identifier used for requests (e.g., gpt-4o-mini, deepseek-chat)',
      modelIdPlaceholder: 'Example: gpt-4o-mini',
      modelName: 'Display name',
      modelNamePlaceholder: 'Enter a display name',
      connectivityTest: {
        button: 'Connectivity Test',
        title: 'Connectivity Test',
        testAll: 'Test All',
        retest: 'Retest',
        stop: 'Stop',
        test: 'Test',
        passed: 'Passed',
        statusTesting: 'Testing',
        statusOk: 'OK',
        statusFail: 'Failed',
        statusTimeout: 'Timeout',
        statusIdle: 'Pending',
        normalCount: 'OK',
        abnormalCount: 'failing',
        notTested: 'Not tested yet',
        noResponse: 'No response',
        firstToken: 'First token',
        noModels: 'No models configured under this provider',
        deleteModel: 'Delete model',
        deleteChatModelBlocked:
          'Cannot delete the model currently selected as chat or title model',
      },
      availableModelsAuto: 'Available models (auto-fetched)',
      searchModels: 'Search models...',
      modeSingle: 'Single',
      modeBatch: 'Batch',
      batchSelectAll: 'Select all',
      batchSelected: 'Selected',
      batchAlreadyAdded: 'Added',
      batchAdd: 'Add selected',
      batchHint:
        'Batch-added models use default settings; fine-tune each one afterwards.',
      fetchModelsFailed: 'Failed to fetch models',
      reasoningType: 'Model type',
      reasoningTypeDesc: 'When unsure, OpenAI reasoning is the safer pick.',
      reasoningTypeNone: 'Non-reasoning model / default',
      reasoningTypeOpenAI: 'OpenAI reasoning_effort style',
      reasoningTypeGeneric: 'Generic reasoning model',
      inputModality: 'Input modality',
      inputModalityDesc:
        'Input types this model actually supports. A wrong pick will cause request failures.',
      inputModalityText: 'Text',
      inputModalityVision: 'Vision',
      inputModalityVisionTooltip:
        'Requires a model with native vision capability.',
      openaiReasoningEffort: 'Reasoning effort',
      openaiReasoningEffortDesc:
        'Choose effort: minimal (gpt-5 only) / low / medium / high',
      builtinToolProvider: 'Built-in provider tools',
      builtinToolProviderDesc:
        'Native tools provided by the model provider. Independent of YOLO-Lite built-in tools. Whether they actually take effect depends on the gateway the request runs through.',
      builtinToolProviderNone: 'Disabled',
      builtinToolProviderGpt: 'OpenAI',
      builtinToolsGpt: 'OpenAI built-in tools',
      builtinToolWebSearch: 'Web Search',
      builtinToolWebSearchDesc:
        'Allow the model to search the web and return cited sources.',
      sampling: 'Custom parameters',
      restoreDefaults: 'Restore defaults',
      maxContextTokens: 'Context window tokens',
      maxContextTokensDesc:
        'Auto-filled when this model is recognized. Adjust it if your provider uses a different limit.',
      maxOutputTokens: 'Max output tokens',
      customParameters: 'Custom parameters',
      customParametersDesc:
        'Attach additional request fields; values accept plain text or JSON (for example, {"thinking": {"type": "enabled"}}).',
      customParametersAdd: 'Add parameter',
      customParametersKeyPlaceholder: 'Key',
      customParametersValuePlaceholder: 'Value',
      customParameterTypeText: 'Text',
      customParameterTypeNumber: 'Number',
      customParameterTypeBoolean: 'Boolean',
      customParameterTypeJson: 'JSON',
      noChatModelsConfigured: 'No chat models configured',
    },
    editor: {
      snippets: {
        sectionTitle: 'Snippets',
        sectionDesc:
          'Type / in the chat input and pick a snippet to insert a preset prompt. Snippets live in YOLO/snippets.md.',
        cardName: 'Snippet library',
        cardDescCount: '{count} snippets',
        cardDescMissing: 'No snippets.md file yet',
        manageBtn: 'Manage snippets',
        initBtn: 'Initialize snippets',
        modalTitle: 'Manage snippets',
        modalCallout:
          'Snippets live in YOLO/snippets.md. Trigger the chat input with / and pick one to insert its body.',
        openFileBtn: 'Open snippets.md',
        createFileBtn: 'Create snippets.md',
        empty: 'No snippets yet',
        jumpBtn: 'Edit',
        deleteBtn: 'Delete',
        deleteTitle: 'Delete snippet',
        deleteMessage:
          'Are you sure you want to delete snippet "{trigger}"? This cannot be undone.',
        deleteConfirm: 'Delete',
        deleteSuccess: 'Deleted snippet "{trigger}"',
        deleteError: 'Delete failed: {error}',
        openError: 'Failed to open snippets.md: {error}',
      },
    },
    etc: {
      title: 'Other',
      exportConfig: 'Export settings',
      exportConfigDesc:
        'Export current plugin settings to a JSON file for use in other vaults.',
      export: 'Export',
      importConfig: 'Import settings',
      importConfigDesc:
        'Import plugin settings from an export file or another vault.',
      import: 'Import',
      resetSettings: 'Reset settings',
      resetSettingsDesc: 'Reset all settings to default values',
      resetSettingsConfirm:
        'Are you sure you want to reset all settings to default values without the ability to undo?',
      resetSettingsSuccess: 'Settings have been reset to defaults',
      reset: 'Reset',
      clearChatHistory: 'Clear chat history',
      clearChatHistoryDesc: 'Delete all chat conversations and messages',
      clearChatHistoryConfirm:
        'Are you sure you want to clear all chat history without the ability to undo?',
      clearChatHistorySuccess: 'All chat history has been cleared',
      clearChatSnapshots: 'Clear chat snapshots and cache',
      clearChatSnapshotsDesc:
        'Delete all conversation context snapshots, edit review snapshots, and timeline height cache files (without deleting chat messages)',
      clearChatSnapshotsConfirm:
        'Are you sure you want to clear all chat snapshot and cache files? This action cannot be undone and context and timeline heights may need to be rebuilt later.',
      clearChatSnapshotsSuccess:
        'All chat snapshot and cache files have been cleared',
      resetProviders: 'Reset providers and models',
      resetProvidersDesc: 'Restore default providers and model configurations',
      resetProvidersConfirm:
        'Are you sure you want to reset providers and models to defaults and overwrite the existing configuration?',
      resetProvidersSuccess: 'Providers and models have been reset to defaults',
      resetAgents: 'Reset agents',
      resetAgentsDesc:
        'Restore default agent configuration and remove custom agents',
      resetAgentsConfirm:
        'Are you sure you want to reset agent configuration? This will remove custom agents and reset the current selection.',
      resetAgentsSuccess: 'Agent configuration has been reset to defaults',
      captureRawRequestDebug: 'Enable LLM request debugging',
      captureRawRequestDebugDesc:
        'When enabled, each AI response shows a Debug button (in the info bar and the more-actions menu) that lets you view or export the raw LLM, tool-call, and web-search requests and responses for that turn. Captured data is kept in memory for the current Obsidian session only and is cleared on restart. API keys are redacted in the export, but the original conversation content is included.',
      yoloBaseDir: 'Plugin data folder',
      yoloBaseDirDesc:
        'Enter a vault-relative path (without a leading /). Example: use YOLO at vault root, or setting/YOLO under the setting folder. Current skills directory: {path}.',
      yoloBaseDirPlaceholder: 'YOLO',
      ribbonClickAction: 'Ribbon icon opens chat in',
      ribbonClickActionDesc:
        'Where the YOLO-Lite ribbon icon opens the Chat view. If a chat already exists in the chosen location it is activated; otherwise a new one is created.',
      ribbonClickActionSidebar: 'Right sidebar',
      ribbonClickActionTab: 'New tab',
      ribbonClickActionSplit: 'Right split',
      ribbonClickActionWindow: 'New window',
      ribbonClickActionLast: 'Last used location',
      mentionDisplayMode: 'Mention display position',
      mentionDisplayModeDesc:
        'Choose whether @ file mentions and / skill selections are shown inline in the editor or as badges above the input box.',
      mentionDisplayModeInline: 'Inside input box',
      mentionDisplayModeBadge: 'Top badges',
      mentionContextMode: '@ file context injection mode',
      mentionContextModeDesc:
        'Control how @ files are injected into the model. In light mode, only the referenced file paths, note properties, and Markdown structure are injected, encouraging the Agent to read only what is necessary.',
      mentionContextModeLight: 'Light mode',
      mentionContextModeFull: 'Full mode',
      chatApplyMode: 'Chat apply behavior',
      chatApplyModeDesc:
        'Only affects Apply in the sidebar Chat. Choose whether edits open inline review first or write directly to the file. Turning review off skips the second confirmation step.',
      chatApplyModeReviewRequired: 'Review before apply',
      chatApplyModeDirectApply: 'Write directly to file',
      chatExportSubsectionTitle: 'Chat export',
      chatExportIncludeThinking: 'Export thinking process',
      chatExportIncludeThinkingDesc:
        'Include assistant reasoning blocks in exported chat markdown.',
      chatExportIncludeToolCalls: 'Export tool calls',
      chatExportIncludeToolCallsDesc:
        'Include tool call arguments and results in exported chat markdown.',
      notifications: 'Notifications',
      notificationsDesc:
        'Configure alerts for Agent runs. System notifications automatically degrade when the environment does not support them.',
      notificationsEnabled: 'Enable notifications',
      notificationsEnabledDesc: 'Turn task alerts on or off for Agent runs.',
      notificationChannel: 'Notification method',
      notificationChannelDesc:
        'Choose whether reminders use sound, system notifications, or both.',
      notificationChannelSound: 'Sound only',
      notificationChannelSystem: 'System only',
      notificationChannelBoth: 'Sound + system',
      notificationTiming: 'Notification timing',
      notificationTimingDesc:
        'Choose whether reminders always fire or only when Obsidian is unfocused.',
      notificationTimingAlways: 'Always notify',
      notificationTimingWhenUnfocused: 'Only when unfocused',
      notificationApprovalRequired: 'Notify when approval is required',
      notificationApprovalRequiredDesc:
        'Alert you when YOLO-Lite pauses and needs you to approve a tool call.',
      notificationTaskCompleted: 'Notify when a task finishes',
      notificationTaskCompletedDesc:
        'Alert you after the current Agent run finishes without waiting for more approvals.',
      interactionSectionTitle: 'Interaction',
      maintenanceSectionTitle: 'Maintenance',
    },
  },

  chat: {
    placeholder:
      'Type a message...「@ to add references or models, / to choose a skill or command」',
    placeholderCompact: 'Click to expand and edit...',
    placeholderPrefix: 'Type a message...',
    placeholderMention: 'add references or models',
    placeholderSkill: 'choose a skill or command',
    editPartialSuccess:
      'Applied {appliedCount} of {totalEdits} edits. Check console for details.',
    statusRequesting: 'Requesting...',
    statusThinking: 'Thinking...',
    contextUsage: 'Context window usage',
    contextUsageUnknownMaxSuffix: ' (context window limit not set)',
    contextBreakdown: {
      title: 'Context',
      fullLabel: '{{percent}} Full',
      tokensSuffix: 'Tokens',
      localEstimateCaption:
        'Local estimate — may differ from server-side billing.',
      unknownMaxHint:
        'Set context window tokens in model settings to show usage percentage.',
      error: 'Estimation failed',
      bucket: {
        system: 'System prompt',
        tools: 'Tools',
        rules: 'Rules',
        skills: 'Skills',
        memory: 'Memory',
        conversation: 'Conversation',
        reasoning: 'Reasoning',
      },
    },
    inlineInfo: {
      callsTitle: '{{count}} calls this turn',
      nextTurnContext: 'Context used: ~{{tokens}} tokens',
      nextTurnContextCached:
        'Context used: ~{{tokens}} tokens ({{cached}} cached)',
    },
    llmDebug: {
      title: 'LLM Debug Data',
      open: 'Open LLM debug data',
      openFailed: 'Failed to open debug data',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Failed to copy debug data',
      save: 'Save',
      savedShort: 'Saved',
      saved: 'LLM debug data saved to {{path}}',
      saveFailed: 'Failed to save debug data',
      expired: 'Debug data was cleared on restart (current session only)',
    },
    sendMessage: 'Send message',
    newChat: 'New chat',
    untitledConversation: 'New chat',
    continueResponse: 'Continue response',
    messageNavigator: {
      title: 'Message navigator',
      itemAriaLabel: 'Jump to message {index}: {label}',
      emptyMessage: 'Empty message',
    },
    stopGeneration: 'Stop generation',
    queueMessage: {
      tooltip: 'Queue this message — it will be sent after the current step',
      hint: 'Waiting for the agent to finish the current step...',
      blockedApproval:
        'Approve or reject the pending tool call before sending a new message.',
      blockedAwaitingInput:
        "Answer the agent's question in the chat before sending a new message.",
      abortedRestoredOne: 'Queued message restored to the input box',
      abortedRestoredMany:
        'Restored the latest queued message to the input box ({{count}} dropped)',
    },
    askUserQuestion: {
      title: 'The agent has questions for you',
      submit: 'Submit answers',
      submitHint: 'Press Cmd / Ctrl + Enter to submit',
      cancel: 'Cancel',
      cancelTooltip: 'Dismiss the questions and end this turn',
      answeredBadge: 'Submitted',
      rejected:
        'The system rejected this question (one ask_user_question per turn, or tool disabled).',
      aborted: 'Stopped before the user could answer.',
      schemaError: 'The agent provided invalid question parameters: {{error}}',
      stale: 'This question has expired or was already handled.',
      otherOption: 'Other (please specify)',
      otherPlaceholder: 'Add your own answer…',
      otherAnswerPrefix: 'Other: ',
      otherAnswerFallback: 'Other',
      freeTextOptional: 'Optional · leave blank to submit empty',
    },
    selectModel: 'Select model',
    uploadImage: 'Upload image',
    uploadFile: 'Add file',
    dropFilesHint: 'Drop to add files',
    imageUnsupportedByModel:
      'This model has not declared image support. Enable the "Vision" input modality in the model settings to attach images.',
    unsupportedFileType: 'Unsupported file type: {names}',
    processImagesFailed: 'Failed to process uploaded images',
    readOfficeFailed: 'Failed to read Office document "{name}": {error}',
    readTextAttachmentFailed: 'Failed to read text file "{name}": {error}',
    addContext: 'Add context',
    applyChanges: 'Apply changes',
    copyMessage: 'Copy message',
    createBranchFromHere: 'Create branch from here',
    branchCreated: 'Branch created',
    branchCreateFailed: 'Failed to create branch',
    insertAtCursor: 'Insert / Replace at cursor',
    insertSuccess: 'Message inserted into the active note',
    insertUnavailable: 'No active markdown editor found',
    noAssistantContent: 'No assistant content to insert',
    regenerate: 'Regenerate',
    reasoning: 'Reasoning',
    assistantQuote: {
      add: 'Quote',
      badge: 'Reply quote',
    },
    mentionMenu: {
      back: 'Back',
      entryCurrentFile: 'Current file',
      entryMode: 'Mode',
      entrySkill: 'Skill',
      entryAssistant: 'Assistant',
      entryModel: 'Model',
      entryFile: 'File',
      entryFolder: 'Folder',
    },
    slashCommands: {
      compact: {
        label: 'Compact Context',
        description:
          'Manually compress earlier conversation history and continue the current task in a fresh context window.',
      },
    },
    slashMenu: {
      entrySkill: 'Skills',
      entrySnippet: 'Snippets',
      createSnippetsFile: 'Click to create snippets.md',
    },
    emptyState: {
      workspaceTitle: 'What would you like to do in {vaultName} today?',
      askTitle: 'Think first, then write',
      askDescription:
        'Great for questions, polishing, and rewriting with focus on expression.',
      chatTitle: 'Think first, then write',
      chatDescription:
        'Great for questions, polishing, and rewriting with focus on expression.',
      agentTitle: 'Let AI execute',
      agentDescription:
        'Enable tools to handle search, read/write operations, and multi-step tasks.',
      agentFullTitle: 'Let AI execute · YOLO Mode',
      agentFullDescription:
        'Auto-approve tool calls for search, read/write operations, and multi-step tasks.',
    },
    quickAccess: {
      manage: 'Manage quick access',
      searchPlaceholder: 'Search skills or snippets',
      skills: 'Skills',
      snippets: 'Snippets',
      empty: 'No matches',
    },
    compaction: {
      pendingTitle: 'Compacting context',
      dividerTitle: 'Continue the current task from here',
      dividerDescription:
        'Earlier conversation has been compressed into a summary. Replies below continue from that summary',
      dividerDescriptionWithEstimate:
        'Earlier conversation has been compressed into a summary. The next-round total context is estimated at about {count} tokens',
      dividerDescriptionWithSavings:
        '{messageCount} messages compacted, saved about {tokens} tokens',
      pendingStatus:
        'Organizing context now. The conversation will continue in a fresh context shortly.',
      success:
        'Earlier context has been compressed. Future replies will continue from the summary.',
      failed: 'Context compaction failed. Please try again shortly.',
      empty: 'There is no conversation content to compact yet.',
      runActive:
        'Wait for the current reply to finish before compacting context.',
      waitingApproval:
        'Resolve the current pending tool approval before compacting context.',
      autoFailed:
        'Automatic context compaction failed. Sending with the previous context.',
    },
    todoPanel: {
      summaryPlanning: '{count} tasks pending',
      summaryInProgress: 'Step {index}/{total}: {text}',
      summaryPartial: '{done}/{total} done',
      summaryAllDone: 'All {total} done',
      expand: 'Expand',
      collapse: 'Collapse',
    },
    codeBlock: {
      showRawText: 'Show raw text',
      showFormattedText: 'Show formatted text',
      copyText: 'Copy text',
      textCopied: 'Text copied',
      apply: 'Apply',
      applying: 'Applying...',
      locatingTarget: 'Locating and loading replacement content...',
      emptyPlanPreview: 'This plan removes content',
      stopApplying: 'Stop apply',
    },
    customContinuePromptLabel: 'Continuation instruction',
    customContinuePromptPlaceholder:
      'Ask AI (@ for files, # for quick actions)',
    customContinueHint: 'Press enter (⏎) to submit',
    customContinueConfirmHint: 'Press enter (⏎) again to confirm',
    customContinueProcessing: 'Thinking',
    customContinueError: 'Generation failed; please try again soon.',
    customContinueSections: {
      suggestions: {
        title: 'Suggestions',
        items: {
          continue: {
            label: 'Continue writing',
            instruction:
              'You are a helpful writing assistant; continue writing from the provided context without repeating or paraphrasing the context, match the tone, language, and style, and output only the continuation text.',
          },
        },
      },
      writing: {
        title: 'Writing',
        items: {
          summarize: {
            label: 'Add a summary',
            instruction: 'Write a concise summary of the current content.',
          },
          todo: {
            label: 'Add action items',
            instruction:
              'Generate a checklist of actionable next steps from the current context.',
          },
          flowchart: {
            label: 'Create a flowchart',
            instruction:
              'Turn the current points into a flowchart or ordered steps.',
          },
          table: {
            label: 'Organize into a table',
            instruction:
              'Convert the current information into a structured table with appropriate columns.',
          },
          freewrite: {
            label: 'Freewriting',
            instruction:
              'Start a fresh continuation in a creative style that fits the context.',
          },
        },
      },
      thinking: {
        title: 'Ideate & converse',
        items: {
          brainstorm: {
            label: 'Brainstorm ideas',
            instruction:
              'Suggest several fresh ideas or angles based on the current topic.',
          },
          analyze: {
            label: 'Analyze this section',
            instruction:
              'Provide a brief analysis highlighting key insights, risks, or opportunities.',
          },
          dialogue: {
            label: 'Ask follow-up questions',
            instruction:
              'Generate thoughtful questions that can deepen understanding of the topic.',
          },
        },
      },
      custom: {
        title: 'Custom',
      },
    },
    editSummary: {
      filesChanged: '{count} file(s) changed',
      operationCreate: 'Created',
      operationDelete: 'Deleted',
      undo: 'Undo',
      undoFile: 'Undo file change',
      undone: 'Undone',
      undoSuccess: "Undid this assistant turn's file changes.",
      undoPartial:
        'Some files were reverted, while others were skipped because they changed afterward.',
      undoUnavailable:
        'File contents have changed, so this turn cannot be safely undone.',
      undoFailed: 'Undo failed. Please try again.',
      fileDeleted: 'This file was deleted. Use undo to restore it.',
      fileMissing: 'The file no longer exists or has been moved.',
    },
    errorCard: {
      title: 'This response failed to generate',
      responseFormat: {
        responseNotObject:
          'The model service returned a response that is not an object (actual: {{actual}}).',
        missingChoices:
          'The model service returned a response that cannot be parsed: missing choices array.',
        invalidChoices:
          'The model service returned a response that cannot be parsed: choices is not an array (actual: {{actual}}).',
        stage: 'Stage: {{stage}}',
        expected: 'Expected field: {{field}}',
        expectedChoicesArray: 'choices array',
        responseFields: 'Response fields: {{fields}}',
        upstreamError: 'Upstream error: {{message}}',
        errorType: 'Error type: {{type}}',
        errorCode: 'Error code: {{code}}',
        upstreamMessage: 'Upstream message: {{message}}',
        responsePreview: 'Response preview: {{preview}}',
      },
    },
    customRewritePromptPlaceholder:
      'Describe how to rewrite the selected text, for example: "make it concise and active voice; keep markdown structure"; press Shift+Enter to confirm, Enter for a new line, and Escape to close.',
    toolCall: {
      status: {
        call: 'Call',
        rejected: 'Rejected',
        running: 'Running',
        failed: 'Failed',
        completed: 'Completed',
        aborted: 'Aborted',
        awaitingUserInput: 'Awaiting',
        unknown: 'Unknown',
      },
      displayName: {
        fs_list: 'List files',
        fs_search: 'Search vault',
        fs_read: 'Read files',
        fs_edit: 'Text editing',
        fs_edit_ops: 'File Editing Toolset',
        fs_file_ops: 'Path Operation Toolset',
        memory_add: 'Add memory',
        memory_update: 'Update memory',
        memory_delete: 'Delete memory',
        open_skill: 'Open skill',
      },
      writeAction: {
        write: 'Write file',
        delete: 'Delete',
        create_dir: 'Create folder',
        move: 'Move path',
      },
      readMode: {
        full: 'Full',
        linesSuffix: ' lines',
      },
      detail: {
        target: 'Target',
        scope: 'Scope',
        query: 'Query',
        path: 'Path',
        paths: 'paths',
      },
      parameters: 'Parameters',
      noParameters: 'No parameters',
      result: 'Result',
      error: 'Error',
      rejectionReason: 'Rejection reason',
      allow: 'Allow',
      reject: 'Reject',
      abort: 'Abort',
      alwaysAllowThisTool: 'Always allow this tool',
      allowForThisChat: 'Allow for this chat',
    },
    toolSummary: {
      todoWrite: {
        cleared: 'Cleared list',
        allCompleted: 'All completed ({count})',
        created: 'Planned {count} tasks',
        progress: 'Progress {done}/{total}',
      },
      terminalCommand: {
        sessionPoll: 'Session {id} · Poll',
        sessionKill: 'Session {id} · Kill',
        sessionInput: 'Session {id} · Input: {preview}',
      },
    },
    liveTask: {
      statusRunning: 'Running',
      statusDone: 'Done',
      statusAborted: 'Aborted',
      statusError: 'Error',
      progress: 'Progress',
      output: 'Output',
      activity: 'Activity',
      abortedBeforeOutput: 'Aborted before any output was collected.',
      noActivity: 'No activity yet.',
      progressTruncated: 'Progress truncated.',
      truncated: 'Output truncated.',
    },
    subagent: {
      openDetails: 'View subagent details',
      planningNextMoves: 'Planning next moves',
      noActivity: 'No activity yet.',
      statusCompleted: 'Completed',
      statusAborted: 'Aborted',
      statusFailed: 'Failed',
      toolUseCount: '{count} tools',
      tokenCount: '{count} tokens',
      approval: {
        heading: 'Awaiting approval',
        headingMulti: 'Awaiting approval · {count}',
        approve: 'Approve',
        reject: 'Reject',
        approveAll: 'Approve all',
        rejectAll: 'Reject all',
        viewDetails: 'View parameters',
      },
    },
    notification: {
      approvalTitle: 'YOLO-Lite needs your confirmation',
      approvalBody:
        'The current task is paused and waiting for you to approve a tool call.',
      completedTitle: 'YOLO-Lite task finished',
      completedBody:
        'The current Agent run has finished. You can come back to review the result.',
      completedErrorBody:
        'The current Agent run has ended. Please return to the window to inspect the result.',
    },
  },

  notices: {
    openYoloNewChatFailed:
      'Failed to open the YOLO-Lite chat window; try the command palette first.',
  },

  statusBar: {
    agentRunningWithApproval:
      'There are currently {count} running agents ({approvalCount} awaiting approval)',
    agentRunning: 'There are currently {count} running agents',
    agentStatusAriaLabel: 'Agent status, click to view running conversations',
    agentStatusTitle:
      'Click to view running conversations and open one in a new chat tab',
    agentStatusPanelTitle: 'Active Agent conversations',
    agentStatusPanelEmpty: 'There are no running conversations to switch to',
    agentStatusRunning: 'Running',
    agentStatusWaitingApproval: 'Awaiting approval',
    agentStatusFallbackConversationTitle: 'Running conversation',
    backgroundStatusPanelTitle: 'Activity and reminders',
    backgroundStatusPanelEmpty: 'There is no activity or reminder',
    backgroundTasksRunning:
      'There are currently {count} background tasks running',
    backgroundTasksNeedAttention: 'A background task needs attention',
  },

  errors: {
    providerNotFound: 'Provider not found',
    modelNotFound: 'Model not found',
    invalidApiKey: 'Invalid API key',
    networkError: 'Network error',
  },

  applyView: {
    applying: 'Applying',
    reviewTitle: 'Review changes',
    changesResolved: 'Changes resolved',
    acceptAllIncoming: 'Accept all incoming',
    keepAllChanges: 'Keep all',
    rejectAll: 'Reject all',
    revertAllChanges: 'Revert all',
    prevChange: 'Previous change',
    nextChange: 'Next change',
    reset: 'Reset',
    applyAndClose: 'Apply & close',
    acceptIncoming: 'Accept incoming',
    keepChange: 'Keep this change',
    acceptCurrent: 'Accept current',
    revertChange: 'Revert this change',
    acceptBoth: 'Accept both',
    acceptedIncoming: 'Accepted incoming',
    keptChange: 'Kept this change',
    keptCurrent: 'Kept current',
    revertedChange: 'Reverted this change',
    mergedBoth: 'Merged both',
    undo: 'Undo',
  },

  chatMode: {
    ask: 'Ask',
    askDesc: 'Ask, refine, create',
    chat: 'Chat',
    chatDesc: 'Ask, refine, create',
    rewrite: 'Rewrite',
    rewriteDesc: 'Only modify the current selection',
    agent: 'Agent',
    agentDesc: 'Tools for complex tasks',
    agentFull: 'Agent (YOLO)',
    agentFullDesc: 'Auto-approve tool calls for complex tasks',
    yolo: 'YOLO',
    yoloDesc: 'Auto-approve tool calls for complex tasks',
    fullAccessWarning: {
      title: 'Please confirm before enabling YOLO Mode',
      description:
        'YOLO Mode auto-approves all tool calls, including file edits and terminal commands. Review the risks before continuing:',
      permission:
        'Tools run without per-call approval. Dangerous command prefixes are still blocked.',
      cost: 'Autonomous runs may consume significant model resources and incur higher costs.',
      backup:
        'Back up important content in advance to avoid unintended changes.',
      checkbox:
        'I understand the risks above and accept responsibility for proceeding',
      cancel: 'Cancel',
      confirm: 'Continue with YOLO Mode',
    },
  },

  reasoning: {
    selectReasoning: 'Select reasoning',
    effort: 'Effort',
    faster: 'Faster',
    smarter: 'Smarter',
    off: 'Off',
    on: 'On',
    auto: 'Auto',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    xhigh: 'XHigh',
    max: 'Max',
    offDesc: 'No thinking, answer directly',
    autoDesc: 'Let the model decide thinking depth based on the prompt',
    lowDesc: 'Lightweight thinking, faster response',
    mediumDesc: 'Balanced thinking depth',
    highDesc: 'Deep thinking, suited for complex problems',
    xhighDesc: 'Extended thinking for highly demanding tasks',
    maxDesc: 'Maximum thinking for the most demanding tasks',
  },

  configTransfer: {
    export: {
      title: 'Export settings',
      description:
        'Select the settings to export. The file will be saved to {path}',
      selectAll: 'Select all',
      selectNone: 'Select none',
      sensitive: 'Contains credentials',
      redactedOption:
        'Redact credentials (replace API keys / passwords / headers / env vars with random strings)',
      confirmUnredactedTitle: 'Confirm export',
      confirmUnredacted:
        'This unredacted export will save API keys / passwords / headers / env vars and other sensitive data to a file in the current vault. Continue?',
      submit: 'Export',
      cancel: 'Cancel',
      noticeAtLeastOne: 'Please select at least one item',
      noticeReadFailed: 'Failed to read current settings',
      noticeSuccess: 'Settings exported to {path}',
      noticeFailed: 'Failed to export settings — check console for details',
    },
    import: {
      title: 'Import settings',
      sourceFile: 'Import from file',
      sourceFileDesc: 'Choose a previously exported .json file',
      sourceVault: 'Import from another vault',
      sourceVaultDesc: 'Choose a vault directory with YOLO-Lite installed',
      description: 'Select the settings to import',
      selectAll: 'Select all',
      selectNone: 'Select none',
      sensitive: 'Contains credentials',
      strategyOverwriteTitle: 'Overwrite',
      strategyOverwriteDesc: 'Replace selected settings with the imported ones',
      strategyMergeTitle: 'JSON merge',
      strategyMergeDesc:
        'Deep merge, keep existing values for fields not present in the import',
      submit: 'Import',
      back: 'Back',
      cancel: 'Cancel',
      noticeInvalidJson:
        'File is not valid JSON. Please pick the correct settings file.',
      noticeFileReadFailed: 'Failed to read the file. Please try again.',
      noticeRedactedHint:
        'Note: this export was redacted. All API keys / passwords / headers / env vars have been cleared and must be re-entered after import.',
      noticeRedactedReminder:
        'Note: this export was redacted. All API keys / passwords / headers / env vars have been cleared — please re-enter them in settings.',
      noticePluginNotFound:
        'No YOLO-Lite plugin settings found in the selected directory.',
      noticeAtLeastOne: 'Please select at least one item',
      noticeSuccess: 'Settings imported successfully',
      noticeFailed: 'Failed to import settings',
    },
    errors: {
      errorNotJson: 'File content is not a valid JSON object.',
      errorNotExportFile:
        'This file is not a YOLO-Lite plugin export file. Please pick a .json produced by the "Export settings" feature.',
      errorInvalidFormatVersion:
        'Invalid export format version — the file may be corrupted.',
      errorInvalidSettingsVersion:
        'Invalid settings version in the export file — it may be corrupted.',
      errorSettingsVersionMismatch:
        'Settings version {fileVersion} does not match the current version {currentVersion}.',
      errorEmptyKeys: 'The export file contains no settings to import.',
      errorMissingData:
        'The data field is missing or invalid in the export file.',
      errorTampered:
        'Export file is inconsistent: data contains fields not declared in keys ({fields}). The file may have been tampered with.',
      errorChecksumMismatch:
        'Export file integrity check failed — the content may have been modified.',
      errorVaultParseFailed:
        'Could not parse the settings data from the target vault.',
      errorVaultMissingVersion:
        'Target vault settings are missing the required version field.',
      errorVaultVersionMismatch:
        'Target vault settings version {vaultVersion} does not match the current version {currentVersion}.',
      errorVaultEmpty: 'Target vault contains no exportable settings.',
      errorApplyVersionMismatch:
        'Import data version {importVersion} does not match the current schema {currentVersion}.',
      errorApplySchema:
        'The imported settings failed validation — fields may be missing or malformed.',
    },
    keyLabels: {
      providers: 'AI providers',
      chatModels: 'Chat models',
      chatModelId: 'Default chat model',
      chatTitleModelId: 'Title-generation model',
      systemPrompt: 'System prompt',
      webSearch: 'Web search',
      skills: 'Skills',
      yolo: 'Base settings',
      debug: 'Debug settings',
      chatOptions: 'Chat preferences',
      notificationOptions: 'Notifications',
      requestPolicy: 'Model request policy',
      assistants: 'Agents',
      currentAssistantId: 'Current agent',
    },
  },
}
