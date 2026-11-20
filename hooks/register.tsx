// azkar-status: the line that animates while Claude works shows a short dhikr
// instead of the step it is on ("Creating notes.md").
//
// Layout, so a pet / icon can be added later without touching the rest:
//   source.ts  - fetch, daily cache, fallback
//   picker.ts  - short-only filter, random without repeats
//   here       - wiring (timers) and drawing (`drawSpinner`)
import { atom, read, update } from 'claude-code'
import type { Hook, Register } from 'claude-code'

import { FALLBACK, loadAzkar } from './source'
import { makePicker, shortOnly } from './picker'

type Engine = Parameters<Hook<'session.start'>>[0]

const current = atom({ plugin: 'azkar-status', key: 'current' } as const, null)

/** How long one dhikr stays before the next. */
const ROTATE_MS = 10_000
/** How often to check whether the daily cache is due. */
const REFRESH_CHECK_MS = 60 * 60 * 1000

/** Surfaces that lay out Arabic right to left; a terminal mostly does not. */
const SURFACES = new Set(['desktop', 'vscode'])

// Unicode isolates: lay the dhikr out right to left inside an LTR row,
// without adding a visible character to it.
const RLI = '⁧'
const PDI = '⁩'

// Module state: rebuilt by session.start after every reload.
let picker = makePicker(FALLBACK)

function useList(all: readonly string[]) {
  const short = shortOnly(all)
  picker = makePicker(short.length > 0 ? short : FALLBACK)
}

function advance($: Engine) {
  return update($, current, () => picker.next())
}

async function refresh($: Engine) {
  try {
    useList(await loadAzkar($))
  } catch {}
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await advance($)
    void refresh($).then(() => advance($))
    $.clock.every(ROTATE_MS, () => advance($))
    $.clock.every(REFRESH_CHECK_MS, () => refresh($))
    return started
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!SURFACES.has(e.surface)) return next(e)
    const dhikr = (await read($, current)) ?? FALLBACK[0]!
    return drawSpinner(e, next, dhikr)
  })
}

/**
 * The drawing. Today: the engine's own row with its word swapped for the
 * dhikr and no trailing ellipsis. A pet later replaces this function only.
 */
function drawSpinner(e: any, next: (e: any) => any, dhikr: string) {
  return next({ ...e, props: { ...e.props, word: RLI + dhikr + PDI, suffix: '' } })
}
