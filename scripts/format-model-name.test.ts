import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { formatModelName } from '../web/lib/utils'

test('formats new Claude model ids', () => {
  assert.equal(formatModelName('claude-sonnet-4-20250514'), 'Sonnet 4')
  assert.equal(formatModelName('claude-opus-4-1-20250805'), 'Opus 4.1')
})

test('formats legacy Claude model ids', () => {
  assert.equal(formatModelName('claude-3-5-sonnet-20241022'), 'Sonnet 3.5')
  assert.equal(formatModelName('claude-3-haiku-20240307'), 'Haiku 3')
})

test('formats GPT model ids', () => {
  assert.equal(formatModelName('gpt-5.3-codex'), 'GPT-5.3-codex')
  assert.equal(formatModelName('gpt-5-2025-01-01'), 'GPT-5')
})

test('falls back to stripped base model id for unknown formats', () => {
  assert.equal(formatModelName('custom-model-20250101'), 'custom-model')
})
