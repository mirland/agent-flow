/**
 * Unit tests for the context_update payload builder used by
 * SessionWatcher.emitContextUpdate.
 *
 * SessionWatcher itself imports the `vscode` extension-host module and
 * cannot be instantiated under a plain `node:test` runner, so the payload
 * construction was extracted to a pure function (buildContextUpdatePayload,
 * in protocol.ts) that can be tested directly. This covers the same
 * acceptance criteria the design's "emitContextUpdate emits
 * contextWindowTokens" test target describes.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildContextUpdatePayload } from '../src/protocol'

function makeBreakdown() {
  return { systemPrompt: 100, userMessages: 20, toolResults: 30, reasoning: 10, subagentResults: 0 }
}

describe('buildContextUpdatePayload', () => {
  it('includes contextWindowTokens when lastReportedTokens is set', () => {
    const payload = buildContextUpdatePayload('orchestrator', {
      contextBreakdown: makeBreakdown(),
      lastReportedTokens: 649000,
    })
    assert.equal(payload.contextWindowTokens, 649000)
  })

  it('omits contextWindowTokens when lastReportedTokens is undefined', () => {
    const payload = buildContextUpdatePayload('orchestrator', {
      contextBreakdown: makeBreakdown(),
      lastReportedTokens: undefined,
    })
    assert.equal('contextWindowTokens' in payload, false)
  })

  it('leaves the cumulative tokens/breakdown fields unchanged regardless of contextWindowTokens', () => {
    const breakdown = makeBreakdown()
    const withReported = buildContextUpdatePayload('orchestrator', { contextBreakdown: breakdown, lastReportedTokens: 5000 })
    const withoutReported = buildContextUpdatePayload('orchestrator', { contextBreakdown: breakdown, lastReportedTokens: undefined })
    assert.equal(withReported.tokens, 160)
    assert.equal(withoutReported.tokens, 160)
    assert.deepEqual(withReported.breakdown, breakdown)
    assert.deepEqual(withoutReported.breakdown, breakdown)
  })
})
