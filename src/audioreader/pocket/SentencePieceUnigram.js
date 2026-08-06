/**
 * A SentencePiece Unigram tokenizer, enough of one to drive PocketTTS.
 *
 * PocketTTS ships its tokenizer as `tokenizer.model` -- a serialized
 * sentencepiece `ModelProto` -- and its reference runtime is Python, so there is
 * no JS tokenizer to borrow. Rather than convert the vocabulary to some other
 * format offline and ship a second artifact that can drift, this parses the
 * original protobuf and implements the Viterbi segmentation directly.
 *
 * Inspecting the English bundle's model tells us exactly which features are
 * needed and, more usefully, which are not:
 *
 *   model_type              UNIGRAM
 *   vocab_size              4000  (1 unknown, 3 control, 256 byte, 3740 normal)
 *   byte_fallback           true
 *   normalizer              "identity", no precompiled charsmap
 *   add_dummy_prefix        true
 *   remove_extra_whitespaces false
 *
 * The identity normalizer is the happy part: no NFKC, no charmap, so there is
 * nothing to reimplement there. Preprocessing is just whitespace escaping plus a
 * leading marker.
 *
 * Verified against the real `sentencepiece` library: see
 * tests/jest/audioreader/fixtures-sentencepiece.json, generated from
 * `sentencepiece` 0.2.2 and asserted token-for-token.
 */

/** Sentencepiece's whitespace marker, U+2581 LOWER ONE EIGHTH BLOCK. */
const SPACE_MARKER = '▁';

/** `SentencePiece.Type` values from sentencepiece_model.proto. */
const PieceType = {
  NORMAL: 1,
  UNKNOWN: 2,
  CONTROL: 3,
  USER_DEFINED: 4,
  UNUSED: 5,
  BYTE: 6,
};

export default class SentencePieceUnigram {
  /**
   * @param {Object} model as returned by {@link SentencePieceUnigram.parse}
   */
  constructor({ pieces, unkId, bosId, eosId }) {
    /** @type {Array<{piece: string, score: number, type: number}>} */
    this.pieces = pieces;
    this.unkId = unkId;
    this.bosId = bosId;
    this.eosId = eosId;

    /**
     * Only NORMAL and USER_DEFINED pieces take part in segmentation. Byte pieces
     * carry a score of 0.0, which is *higher* than every real piece's log
     * probability, so leaving them in the lattice would make the tokenizer prefer
     * spelling everything out byte by byte.
     * @type {Map<string, {id: number, score: number}>}
     */
    this.vocab = new Map();
    /** @type {Map<string, number>} byte pieces, `<0xAB>` -> id */
    this.byteIds = new Map();

    let maxPieceChars = 1;
    let minScore = 0;

    pieces.forEach((entry, id) => {
      if (entry.type === PieceType.BYTE) {
        this.byteIds.set(entry.piece, id);
        return;
      }
      if (entry.type !== PieceType.NORMAL && entry.type !== PieceType.USER_DEFINED) return;

      this.vocab.set(entry.piece, { id, score: entry.score });
      maxPieceChars = Math.max(maxPieceChars, [...entry.piece].length);
      minScore = Math.min(minScore, entry.score);
    });

    this.maxPieceChars = maxPieceChars;
    /**
     * Cost of consuming one character with no matching piece. Must be worse than
     * any real path so segmentation only falls back when it has to.
     */
    this.fallbackScore = minScore - 10;

    /** @type {Map<number, string>} id -> piece, for decoding */
    this.idToPiece = new Map(pieces.map((entry, id) => [id, entry.piece]));
  }

  /**
   * Parse a serialized sentencepiece ModelProto.
   * @param {ArrayBuffer|Uint8Array} buffer
   * @return {SentencePieceUnigram}
   */
  static parse(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const reader = new ProtoReader(bytes);
    const pieces = [];
    let unkId = 0;
    let bosId = 1;
    let eosId = 2;

    while (reader.hasMore()) {
      const { field, wire } = reader.readTag();

      // ModelProto.pieces = 1
      if (field === 1 && wire === 2) {
        pieces.push(readPiece(reader.readBytes()));
        continue;
      }
      // ModelProto.trainer_spec = 2
      if (field === 2 && wire === 2) {
        const spec = readTrainerSpec(reader.readBytes());
        unkId = spec.unkId ?? unkId;
        bosId = spec.bosId ?? bosId;
        eosId = spec.eosId ?? eosId;
        continue;
      }
      reader.skip(wire);
    }

    if (!pieces.length) throw new Error('SentencePiece: model contains no pieces');
    return new SentencePieceUnigram({ pieces, unkId, bosId, eosId });
  }

  get vocabSize() {
    return this.pieces.length;
  }

  /**
   * Apply the model's normalizer settings. With an identity normalizer and
   * `remove_extra_whitespaces` off, this is only whitespace escaping plus the
   * dummy prefix.
   * @param {string} text
   * @return {string}
   */
  normalize(text) {
    return SPACE_MARKER + text.replace(/ /g, SPACE_MARKER);
  }

  /**
   * @param {string} text
   * @return {number[]} token ids
   */
  encode(text) {
    return this.encodeAsPieces(text).map(piece => (
      this.vocab.get(piece)?.id ?? this.byteIds.get(piece) ?? this.unkId
    ));
  }

  /**
   * Viterbi over the unigram lattice: for every position keep the best-scoring
   * path that reaches it, then walk the choices back from the end.
   * @param {string} text
   * @return {string[]} pieces, including `<0xAB>` byte pieces where needed
   */
  encodeAsPieces(text) {
    if (!text) return [];
    const chars = [...this.normalize(text)];
    const n = chars.length;

    /** best[i] = score of the best path covering chars[0..i) */
    const best = new Float64Array(n + 1).fill(-Infinity);
    /** where the piece ending at i started */
    const from = new Int32Array(n + 1).fill(-1);
    /** the piece used to get to i, or null when it was a fallback character */
    const used = new Array(n + 1).fill(null);
    best[0] = 0;

    for (let i = 0; i < n; i++) {
      if (best[i] === -Infinity) continue;

      const limit = Math.min(this.maxPieceChars, n - i);
      let matchedSingle = false;

      for (let length = 1; length <= limit; length++) {
        const candidate = chars.slice(i, i + length).join('');
        const entry = this.vocab.get(candidate);
        if (!entry) continue;
        if (length === 1) matchedSingle = true;

        const score = best[i] + entry.score;
        if (score > best[i + length]) {
          best[i + length] = score;
          from[i + length] = i;
          used[i + length] = candidate;
        }
      }

      // No piece covers this single character, so it has to be spelled out as
      // raw bytes. Keep it in the lattice rather than bailing out, so the rest of
      // the string still gets segmented well.
      if (!matchedSingle) {
        const score = best[i] + this.fallbackScore;
        if (score > best[i + 1]) {
          best[i + 1] = score;
          from[i + 1] = i;
          used[i + 1] = null;
        }
      }
    }

    // Collect one entry per lattice edge, then reverse the edges. Reversing a
    // flat list of pieces instead would scramble multi-byte characters, and
    // detecting byte runs afterwards cannot tell one fallback character from the
    // next -- consecutive unmatched characters look like a single run.
    /** @type {string[][]} */
    const edges = [];
    let position = n;
    while (position > 0) {
      const start = from[position];
      const piece = used[position];
      if (start < 0) {
        // Should be unreachable: the fallback edge guarantees a path.
        throw new Error('SentencePiece: no segmentation found');
      }
      edges.push(piece === null
        ? this._toBytePieces(chars.slice(start, position).join(''))
        : [piece]);
      position = start;
    }

    edges.reverse();
    return edges.flat();
  }

  /**
   * @private
   * @param {string} text
   * @return {string[]} `<0xAB>` pieces for each UTF-8 byte
   */
  _toBytePieces(text) {
    const encoded = new TextEncoder().encode(text);
    const pieces = [];
    for (const byte of encoded) {
      pieces.push(`<0x${byte.toString(16).toUpperCase().padStart(2, '0')}>`);
    }
    return pieces;
  }

  /**
   * @param {number[]} ids
   * @return {string}
   */
  decode(ids) {
    /** @type {number[]} */
    let pendingBytes = [];
    let output = '';

    const flushBytes = () => {
      if (!pendingBytes.length) return;
      output += new TextDecoder().decode(new Uint8Array(pendingBytes));
      pendingBytes = [];
    };

    for (const id of ids) {
      const piece = this.idToPiece.get(id);
      if (piece === undefined) continue;

      const byteMatch = /^<0x([0-9A-Fa-f]{2})>$/.exec(piece);
      if (byteMatch) {
        pendingBytes.push(parseInt(byteMatch[1], 16));
        continue;
      }
      flushBytes();

      const type = this.pieces[id].type;
      if (type === PieceType.CONTROL) continue;
      output += piece;
    }
    flushBytes();

    // Undo the whitespace escaping and the dummy prefix.
    const text = output.split(SPACE_MARKER).join(' ');
    return text.startsWith(' ') ? text.slice(1) : text;
  }
}

/**
 * @param {Uint8Array} bytes a `SentencePiece` submessage
 * @return {{piece: string, score: number, type: number}}
 */
function readPiece(bytes) {
  const reader = new ProtoReader(bytes);
  let piece = '';
  let score = 0;
  let type = PieceType.NORMAL;

  while (reader.hasMore()) {
    const { field, wire } = reader.readTag();
    if (field === 1 && wire === 2) piece = new TextDecoder().decode(reader.readBytes());
    else if (field === 2 && wire === 5) score = reader.readFloat();
    else if (field === 3 && wire === 0) type = reader.readVarint();
    else reader.skip(wire);
  }
  return { piece, score, type };
}

/**
 * @param {Uint8Array} bytes a `TrainerSpec` submessage
 * @return {{unkId?: number, bosId?: number, eosId?: number}}
 */
function readTrainerSpec(bytes) {
  const reader = new ProtoReader(bytes);
  const spec = {};
  while (reader.hasMore()) {
    const { field, wire } = reader.readTag();
    if (field === 40 && wire === 0) spec.unkId = reader.readVarint();
    else if (field === 41 && wire === 0) spec.bosId = reader.readVarint();
    else if (field === 42 && wire === 0) spec.eosId = reader.readVarint();
    else reader.skip(wire);
  }
  return spec;
}

/** Just enough protobuf wire-format reading for this one message type. */
class ProtoReader {
  /** @param {Uint8Array} bytes */
  constructor(bytes) {
    this.bytes = bytes;
    this.offset = 0;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  hasMore() {
    return this.offset < this.bytes.length;
  }

  readVarint() {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.bytes[this.offset++];
      result += (byte & 0x7F) * Math.pow(2, shift);
      if (!(byte & 0x80)) return result;
      shift += 7;
    }
  }

  readTag() {
    const tag = this.readVarint();
    return { field: tag >>> 3, wire: tag & 7 };
  }

  readBytes() {
    const length = this.readVarint();
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  readFloat() {
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /** @param {number} wire */
  skip(wire) {
    if (wire === 0) this.readVarint();
    else if (wire === 2) this.readBytes();
    else if (wire === 5) this.offset += 4;
    else if (wire === 1) this.offset += 8;
    else throw new Error(`SentencePiece: unsupported wire type ${wire}`);
  }
}
