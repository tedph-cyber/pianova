export { mod12, pitchClasses, degree } from './pitch';
export {
  QUALITIES, INTERVALS, identifyChord,
  type QualityId, type ChordQuality, type IntervalInfo, type ChordMatch, type IntervalMatch, type Match,
} from './chords';
export {
  noteLabel, chordLabel,
  type Notation, type Accidentals, type NoteLabelOptions, type FeelWords, type ChordLabelOptions, type ChordLabel,
} from './labels';
export {
  SCALE_INTERVALS, scale, spellScale, keySignature, diatonicChords,
  type ScaleType, type KeyMode, type SpellOptions, type KeySignature, type DiatonicChord,
} from './scales';
export { findKey, type KeyCandidate } from './key';
