import { DEFAULT_LOCALE, LOCALES, LOCALE_IDS, pickLocale } from '../locales'

const KEYS = Object.keys(LOCALES[DEFAULT_LOCALE].strings).sort()

const stringsOf = (locale: (typeof LOCALE_IDS)[number]) =>
  LOCALES[locale].strings as Record<string, string>

const placeholders = (value: string) =>
  [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(match => match[1]).sort()

/** The four tabs share the width of a phone. */
const TAB_LABELS = ['nav_today', 'nav_plan', 'nav_hero', 'nav_settings']
const TAB_LABEL_MAX = 12

describe.each(LOCALE_IDS)('locale %s', locale => {
  const strings = stringsOf(locale)

  it('has exactly the keys of the default language', () => {
    expect(Object.keys(strings).sort()).toEqual(KEYS)
  })

  it('leaves no string empty', () => {
    const empty = KEYS.filter(key => strings[key].trim() === '')

    expect(empty).toEqual([])
  })

  it('uses the same placeholders as the default language', () => {
    const source = stringsOf(DEFAULT_LOCALE)
    const different = KEYS.filter(
      key =>
        placeholders(strings[key]).join() !== placeholders(source[key]).join(),
    )

    expect(different).toEqual([])
  })

  it('has no exclamation marks and no emoji', () => {
    const loud = KEYS.filter(key =>
      /!|\p{Extended_Pictographic}/u.test(strings[key]),
    )

    expect(loud).toEqual([])
  })

  it('has no plural forms: every string reads right for any number', () => {
    const plural = KEYS.filter(key =>
      /_(zero|one|two|few|many|other)$/.test(key),
    )

    expect(plural).toEqual([])
  })

  it(`keeps tab labels to ${TAB_LABEL_MAX} characters`, () => {
    const long = TAB_LABELS.filter(key => strings[key].length > TAB_LABEL_MAX)

    expect(long).toEqual([])
  })
})

describe('Ukrainian', () => {
  const strings = stringsOf('uk')

  it('writes the apostrophe as ʼ (U+02BC), never as a quote mark', () => {
    const wrong = KEYS.filter(key =>
      /[\p{Script=Cyrillic}]['’`][\p{Script=Cyrillic}]/u.test(strings[key]),
    )

    expect(wrong).toEqual([])
  })

  it('addresses the reader as "ви", not "ти"', () => {
    const familiar = KEYS.filter(key =>
      /(^|[^\p{L}])(ти|тебе|тобі|твій|твоя|твоє|твої)([^\p{L}]|$)/iu.test(
        strings[key],
      ),
    )

    expect(familiar).toEqual([])
  })
})

describe('pickLocale', () => {
  it('ignores the region', () => {
    expect(pickLocale(['uk-UA'])).toBe('uk')
    expect(pickLocale(['en-GB'])).toBe('en')
  })

  it('takes the first language the app speaks', () => {
    expect(pickLocale(['de-DE', 'uk', 'en'])).toBe('uk')
    expect(pickLocale(['pl', 'EN-us'])).toBe('en')
  })

  it('falls back to the default language', () => {
    expect(pickLocale(['de', 'fr'])).toBe(DEFAULT_LOCALE)
    expect(pickLocale([])).toBe(DEFAULT_LOCALE)
  })
})
