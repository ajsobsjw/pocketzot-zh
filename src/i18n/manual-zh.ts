// Hand-written translations for content the 0.34.1 Chinese database does not
// carry: species/backgrounds added in later DCSS versions, and prose that has
// no English→Chinese pair in dat/descript/zh.
//
// Keyed by the English paragraph verbatim (whitespace is normalised before
// lookup), so it participates in the same prose lookup as the generated pairs.

export const MANUAL_PROSE: Record<string, string> = {
  // Gale Centaur (DCSS 0.35): absent from the 0.34.1 Chinese descriptions.
  'Powerful equine hybrids who trace their ancestry to the four winds themselves, Gale Centaurs are at their strongest while galloping swiftly towards foes.':
    '强壮的半人马混血种，自称血脉可追溯至四方之风；疾风半人马在向敌人疾驰冲锋时最为强大。',
}

/** Names missing from the engine dictionary (same key space as names-zh). */
export const MANUAL_NAMES: Record<string, string> = {
  'Gale Centaur': '疾风半人马',
}
