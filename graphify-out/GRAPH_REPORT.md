# Graph Report - .  (2026-07-17)

## Corpus Check
- Large corpus: 451 files · ~525,676 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 986 nodes · 1844 edges · 80 communities (61 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 35 edges
2. `Json` - 29 edges
3. `requireFlag()` - 28 edges
4. `getFlag()` - 25 edges
5. `supabaseAdmin` - 23 edges
6. `logWarning()` - 22 edges
7. `loadConfig()` - 22 edges
8. `compilerOptions` - 20 edges
9. `logStep()` - 19 edges
10. `authenticate()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Output` --references--> `Json`  [EXTRACTED]
  cli/resend.ts → server/src/db/database.types.ts
- `syncDefects()` --indirect_call--> `defect()`  [INFERRED]
  scripts/jira-sync.ts → cli/xray/commands/run.ts
- `create()` --indirect_call--> `s()`  [INFERRED]
  cli/xray/commands/test.ts → server/src/services/rule-engine.test.ts
- `saveConfig()` --references--> `Json`  [EXTRACTED]
  cli/sync-openapi.ts → server/src/db/database.types.ts
- `downloadFromUrl()` --references--> `Json`  [EXTRACTED]
  cli/sync-openapi.ts → server/src/db/database.types.ts

## Import Cycles
- 1-file cycle: `client/src/i18n/index.tsx -> client/src/i18n/index.tsx`

## Communities (80 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (87): login(), logout(), status(), backupExport(), findTestByKey(), restore(), syncTestSteps(), addTests() (+79 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (68): AdfDocument, AdfMark, AdfNode, adfToMarkdown(), BUG_FIELDS, cleanMarkdown(), cmdHelp(), cmdPull() (+60 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (62): checkCommand(), checkMigrationNeeded(), cleanup(), cloneTemplate(), collectFiles(), colors, countFilesInDir(), createBackup() (+54 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (34): AcademicProvider, AcademicStudent, Certificate, CertificateProvider, ProviderHealth, ProviderRegistry, DiplomaPushResult, GuaraniApiStudent (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (36): husky.sh script, author, dependencies, @inquirer/prompts, description, devDependencies, @antfu/eslint-config, eslint (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): dependencies, axios, @emotion/react, @emotion/styled, i18next, @mui/icons-material, @mui/material, react (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (16): ArchDiagram(), AuthMethods(), AgentCodeBlock(), CodeBlock(), EnvSetup(), AgentKey, QaConfig, demoUsers (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (6): config, ApiBase, AuthResult, RequestOptions, TestContext, TestFixture

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (15): supabaseAdmin, AuthContext, authenticate(), getJwtSecret(), requireRole(), bulkGradeSchema, createOverrideSchema, createTrackSchema (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (25): dependencies, hono, @hono/zod-validator, jose, pino, puppeteer, @scalar/hono-api-reference, @supabase/supabase-js (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (22): ApiResponse, AttachmentDetail, AttachmentDownload, commandAttachments(), commandDownload(), commandHelp(), commandInbox(), commandRead() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (16): app, port, errorHandler(), notFoundHandler(), admin, createUserSchema, certificates, coordinator (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (17): main(), cron, createNotification(), CreateNotificationParams, createNotificationsBatch(), getNotifications(), getUnreadCount(), hasExistingUnreadNotification() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (19): args, copyFromLocal(), detectSpecFilename(), downloadFromGitHub(), downloadFromUrl(), fileIndex, generateTypes(), getConfigInteractive() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (11): ProtectedRoute(), ProtectedRouteProps, CoordinatorPage(), StudentRow, TrackSummary, DashboardPage(), FeatureCard, LandingPage() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module, moduleResolution (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noEmit (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (12): supabase, JwtPayload, auth, createAccessToken(), createRefreshToken(), getJwtSecret(), loginSchema, parseExpiryToSeconds() (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (12): DiplomaRecord, DiplomaResult, formatDate(), generateDiplomaForEnrollment(), generateDiplomaPdf(), generateReferenceCode(), getBrowser(), getDiplomaDb() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.23
Nodes (10): DEFAULT_BACKOFF, DEFAULT_RETRY_STATUS, delay(), isRetryableError(), RetryOptions, RetryResult, TimeoutError, withRetry() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (11): Course, CourseManagement(), CourseManagementProps, Track, Course, Diagnostics, EligibilityResult, OverrideItem (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.21
Nodes (12): buildRuleTree(), collectAllCourseIds(), collectMissingCourses(), EligibilityResult, evaluateNode(), evaluateTrackEligibility(), OverrideRow, RuleEvalResult (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (13): Authorization, postman, tavily, enabled, headers, oauth, type, url (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (8): LanguageSwitcher(), en, es, getAvailableLanguages(), Language, setLanguage(), Translations, LoginPage()

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (9): integrations, syncLocks, guaraniService, IntegrationType, logPerStudent(), logSyncComplete(), logSyncStart(), SyncStatus (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.27
Nodes (8): EnrollmentOption, GradeExamModal(), GradeExamModalProps, t(), api, AdminStats, EligibilityStatus, StudentProgress

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): MainLayout(), NavItem, navItems, roleLabels, NotificationItem, NotificationPopover(), typeColor, typeLabel

### Community 28 - "Community 28"
Cohesion: 0.31
Nodes (7): SessionManager(), handle401(), isTokenExpired(), LoginResponse, notifySessionExpired(), onSessionExpired(), tryRefreshToken()

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Tables, TablesInsert (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (9): SLACK_MCP_ADD_MESSAGE_TOOL, SLACK_MCP_CHANNELS_CACHE, SLACK_MCP_USERS_CACHE, SLACK_MCP_XOXP_TOKEN, slack, command, enabled, environment (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): AdminStatsGrid(), AdminStatsGridProps, AdminPage(), DashboardStats, Student, StudentsResponse

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): SysAdminPage(), OverrideRow, r(), RuleRow, s(), SourceRow

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (8): command, enabled, environment, type, JIRA_API_TOKEN, JIRA_URL, JIRA_USERNAME, atlassian

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (8): API_BASE_URL, API_HEADERS, OPENAPI_SPEC_PATH, openapi, command, enabled, environment, type

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): buildCommand, framework, installCommand, outputDirectory, rewrites, rootDirectory, version

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): buildCommand, bunVersion, crons, installCommand, rewrites, version

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): command, enabled, type, mcp, context7, $schema

### Community 38 - "Community 38"
Cohesion: 0.47
Nodes (5): app, createToken(), headers(), JWT_SECRET, run()

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (4): COURSES, db, STUDENTS, TRACK

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (6): GEMINI_API_KEY, nanobanana, command, enabled, environment, type

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (6): SUPABASE_ACCESS_TOKEN, supabase, command, enabled, environment, type

### Community 42 - "Community 42"
Cohesion: 0.50
Nodes (4): Certificate, CertificateResponse, CertificatesPage(), mapResponse()

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): ApiCertificate, ApiCourse, Course, CoursesPage()

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (4): IntegrationsPage(), IntegrationStatus, mapStatus(), ProviderHealth

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (4): escaped, outPath, yaml, yamlPath

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (4): command, enabled, type, devtools

### Community 48 - "Community 48"
Cohesion: 0.50
Nodes (4): notion, enabled, type, url

### Community 49 - "Community 49"
Cohesion: 0.50
Nodes (4): playwright, command, enabled, type

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (4): sentry, enabled, type, url

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (4): shadcn, command, enabled, type

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (4): sql, command, enabled, type

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): vercel, enabled, type, url

## Knowledge Gaps
- **382 isolated node(s):** `husky.sh script`, `ParsedArgs`, `ApiResponse`, `EmailListItem`, `EmailDetail` (+377 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Json` connect `Community 0` to `Community 32`, `Community 1`, `Community 2`, `Community 38`, `Community 7`, `Community 8`, `Community 10`, `Community 42`, `Community 14`, `Community 15`, `Community 21`, `Community 26`, `Community 27`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.381) - this node is a cross-community bridge._
- **Why does `searchIssues()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `recordSyncVersion()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `husky.sh script`, `ParsedArgs`, `ApiResponse` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05836713101745724 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06223358908780904 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._