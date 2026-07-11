/**
 * Unit tests for TranscriptParser's usage-based context fill tracking.
 *
 * Feeds the claude-usage-sample fixture through processTranscriptLine() via a
 * mock delegate and asserts session.lastReportedTokens reflects the latest
 * authoritative usage.input_tokens value reported in the JSONL, persisting
 * across entries without usage and updating (not clamping) after drops.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TranscriptParser, type TranscriptParserDelegate } from '../src/transcript-parser'
import type { AgentEvent, WatchedSession } from '../src/protocol'

/** Build a minimal WatchedSession with defaults sufficient for the parser. */
function createMockSession(sessionId: string): WatchedSession {
  return {
    sessionId,
    filePath: '/tmp/fixture.jsonl',
    fileWatcher: null,
    pollTimer: null,
    fileSize: 0,
    sessionStartTime: Date.now(),
    pendingToolCalls: new Map(),
    seenToolUseIds: new Set(),
    seenMessageHashes: new Set(),
    sessionDetected: true,
    sessionCompleted: false,
    lastActivityTime: Date.now(),
    inactivityTimer: null,
    subagentWatchers: new Map(),
    spawnedSubagents: new Set(),
    inlineProgressAgents: new Set(),
    subagentsDirWatcher: null,
    subagentsDir: null,
    label: 'test session',
    labelSet: false,
    model: null,
    permissionTimer: null,
    permissionEmitted: false,
    contextBreakdown: { systemPrompt: 0, userMessages: 0, toolResults: 0, reasoning: 0, subagentResults: 0 },
  }
}

/** Feed each line of the fixture through the parser one at a time, returning
 *  the session state after each processed line so tests can assert on the
 *  progression of lastReportedTokens across entries. */
function runFixtureStepwise() {
  const file = path.join(__dirname, 'fixtures', 'claude-usage-sample.jsonl')
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim())
  const sessionId = 'test-session-usage-0001'
  const session = createMockSession(sessionId)
  const events: AgentEvent[] = []
  const delegate: TranscriptParserDelegate = {
    emit: (e) => events.push(e),
    elapsed: () => 0,
    getSession: () => session,
    fireSessionLifecycle: () => {},
    emitContextUpdate: () => {},
  }
  const parser = new TranscriptParser(delegate)
  const ctxPending = new Map()
  const ctxSeen = new Set<string>()
  const ctxSeenMessages = new Set<string>()
  const snapshotsAfterLine: (number | undefined)[] = []
  for (const line of lines) {
    parser.processTranscriptLine(line, 'orchestrator', ctxPending, ctxSeen, sessionId, ctxSeenMessages)
    snapshotsAfterLine.push(session.lastReportedTokens)
  }
  return { session, events, snapshotsAfterLine }
}

describe('TranscriptParser — lastReportedTokens', () => {
  it('sets lastReportedTokens from usage.input_tokens on an assistant entry', () => {
    const { snapshotsAfterLine } = runFixtureStepwise()
    assert.equal(snapshotsAfterLine[0], 649000)
  })

  it('persists lastReportedTokens across an entry with no usage field', () => {
    const { snapshotsAfterLine } = runFixtureStepwise()
    // Line 2 is a user/tool_result entry with no usage — value must persist.
    assert.equal(snapshotsAfterLine[1], 649000)
  })

  it('ignores malformed usage (null input_tokens) without throwing', () => {
    const { snapshotsAfterLine } = runFixtureStepwise()
    // Line 3 has usage.input_tokens: null — must be ignored, prior value retained.
    assert.equal(snapshotsAfterLine[2], 649000)
  })

  it('updates to a lower value after compaction with no smoothing', () => {
    const { snapshotsAfterLine } = runFixtureStepwise()
    // Line 4 reports a lower input_tokens (post-compaction) — must jump immediately.
    assert.equal(snapshotsAfterLine[3], 12000)
  })

  it('never throws on the full fixture', () => {
    assert.doesNotThrow(() => runFixtureStepwise())
  })
})
