// Motor de transposición de cifrados (acordes en texto plano sobre la letra).
// No usa audio ni OCR: los cifrados ya vienen como texto ("B9", "F#m7",
// "Dadd2/F#"...), así que basta con reconocer el patrón de cada símbolo y
// desplazarlo N semitonos en la escala cromática.

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const NOTE_TO_INDEX = {
    'C': 0, 'B#': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11,
}

export const KEY_OPTIONS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']

// Lista cerrada de "calidades" de acorde reconocidas (m, maj7, sus4, add9,
// dim, 9, ^7...). Es deliberadamente una lista cerrada y NO "cualquier
// combinación de letras": con un patrón permisivo, palabras en mayúscula
// como "ANTE" o "DIOS" (títulos, letras) se leerían como acordes (A+"NTE",
// D+"IOS") y se corromperían al transponer. Ordenadas de más larga a más
// corta para que el motor de regex intente primero los sufijos compuestos.
const QUALITY_TOKENS = [
    'maj13', 'maj11', 'maj9', 'maj7', 'maj',
    'min13', 'min11', 'min9', 'min7', 'min',
    'dim7', 'dim',
    'aug',
    'sus2', 'sus4', 'sus',
    'add13', 'add11', 'add9', 'add4', 'add2',
    'm7b5', 'm7#5', 'm6', 'm7', 'm9', 'm11', 'm13', 'm',
    '7sus4', '9sus4',
    '7b5', '7#5', '7b9', '7#9', '7#11', '7',
    '6/9', '6',
    '13', '11', '9', '5', '4', '2',
    '^13', '^11', '^9', '^7',
    '+', '°',
].sort((a, b) => b.length - a.length)

const PAREN_EXTRAS = ['add2', 'add4', 'add9', 'add11', 'add13', 'b5', '#5', 'b9', '#9', '#11', 'sus4']
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const QUALITY_ALTERNATION = QUALITY_TOKENS.map(escapeRegex).join('|')
const PAREN_ALTERNATION = PAREN_EXTRAS.map(escapeRegex).join('|')

// Nota raíz (A-G) + alteración opcional + calidad conocida (opcional, para
// acordes simples como "B" o "F#") + extra entre paréntesis opcional +
// bajo opcional tras "/".
const CHORD_TOKEN_REGEX = new RegExp(
    `^([A-G])(#|b)?((?:${QUALITY_ALTERNATION})?(?:\\((?:${PAREN_ALTERNATION})\\))?)(\\/([A-G])(#|b)?)?$`
)

export function isChordToken(token) {
    return CHORD_TOKEN_REGEX.test(token)
}

function shiftNote(letter, accidental, semitones, scale) {
    const key = letter + (accidental || '')
    const index = NOTE_TO_INDEX[key]
    if (index === undefined) return key
    const newIndex = ((index + semitones) % 12 + 12) % 12
    return scale[newIndex]
}

export function transposeToken(token, semitones, preferFlats = false) {
    const match = token.match(CHORD_TOKEN_REGEX)
    if (!match || semitones === 0) return token
    const [, root, accidental, quality, , bassRoot, bassAccidental] = match
    const scale = preferFlats ? NOTES_FLAT : NOTES_SHARP

    const newRoot = shiftNote(root, accidental, semitones, scale)
    if (!bassRoot) return newRoot + quality
    const newBass = shiftNote(bassRoot, bassAccidental, semitones, scale)
    return `${newRoot}${quality}/${newBass}`
}

// Una línea se transpone solo si al menos la mitad de sus "palabras" son
// acordes reconocibles — así una línea de letra (texto normal) no se toca,
// pero una línea mixta como "INTRO:  B9  E9  (2)" sí transpone B9/E9 y deja
// "INTRO:" y "(2)" intactos.
export function transposeLine(line, semitones, preferFlats = false) {
    if (semitones === 0) return line
    const parts = line.split(/(\s+)/)
    const words = parts.filter(p => p.trim() !== '')
    if (words.length === 0) return line
    const chordCount = words.filter(isChordToken).length
    if (chordCount / words.length < 0.5) return line

    return parts.map(p => (p.trim() !== '' && isChordToken(p)) ? transposeToken(p, semitones, preferFlats) : p).join('')
}

export function transposeChordChart(text, semitones, preferFlats = false) {
    if (!text) return text
    return text.split('\n').map(line => transposeLine(line, semitones, preferFlats)).join('\n')
}

export function transposeKeyLabel(key, semitones, preferFlats = false) {
    if (!key) return ''
    return transposeToken(key.trim(), semitones, preferFlats)
}

function keyToIndex(key) {
    if (!key) return null
    const match = key.trim().match(/^([A-G])(#|b)?/)
    if (!match) return null
    return NOTE_TO_INDEX[match[1] + (match[2] || '')] ?? null
}

// Semitonos (con signo, en el rango -6..+5: el camino más corto) para pasar
// de una tonalidad a otra. Útil para el selector de "ir directo a esta
// tonalidad", en vez de solo subir/bajar de a un semitono.
export function keyDifference(fromKey, toKey) {
    const fromIndex = keyToIndex(fromKey)
    const toIndex = keyToIndex(toKey)
    if (fromIndex === null || toIndex === null) return 0
    return ((toIndex - fromIndex + 6 + 12) % 12) - 6
}

// Mejor esfuerzo para inferir la tonalidad de un cifrado que no tiene
// "tonalidad original" guardada: toma la raíz del primer acorde reconocido
// en el texto. Es solo una sugerencia (muchas canciones modulan a mitad de
// camino) — el usuario siempre puede corregirla a mano.
export function detectFirstChordRoot(chordChart) {
    if (!chordChart) return null
    const tokens = chordChart.split(/\s+/)
    for (const token of tokens) {
        const match = token.match(CHORD_TOKEN_REGEX)
        if (match) return match[1] + (match[2] || '')
    }
    return null
}
