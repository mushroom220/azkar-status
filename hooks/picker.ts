// Which dhikr to show: short ones only, random, never the same twice in a row.

/** A dhikr is shown when it has fewer visible letters than this. */
export const MAX_VISIBLE = 60

/** Letters a reader sees: tashkeel (combining marks) and tatweel are not counted. */
export function visibleLength(s: string): number {
  return s.replace(/[\p{Mn}ـ]/gu, '').length
}

export function shortOnly(items: readonly string[]): string[] {
  return items.filter(s => visibleLength(s) < MAX_VISIBLE)
}

/**
 * A shuffled bag: every dhikr once before any comes back, and the first of a
 * new bag is never the one just shown.
 */
export function makePicker(items: readonly string[], random: () => number = Math.random) {
  let bag: string[] = []
  let last: string | null = null
  return {
    next(): string | null {
      if (items.length === 0) return null
      if (bag.length === 0) {
        bag = [...items]
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1))
          ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
        }
        if (bag.length > 1 && bag[bag.length - 1] === last) {
          ;[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1]!, bag[0]!]
        }
      }
      last = bag.pop()!
      return last
    },
  }
}
