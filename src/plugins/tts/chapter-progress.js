import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Slider showing how far read aloud is through the current chapter.
 * Fires `seek` with `detail.value` (0-1) when the user releases the thumb.
 */
@customElement('br-tts-chapter-progress')
export class BRTtsChapterProgress extends LitElement {
  /** Fraction (0-1) of the chapter that has been read */
  @property({ type: Number })
  value = 0;

  /** Number of pages in the chapter; the track shows a divider between pages */
  @property({ type: Number })
  pages = 1;

  @property({ type: String })
  label = 'Chapter progress';

  /**
   * Position while the user is dragging; takes precedence over `value` so
   * playback updates don't yank the thumb out from under them
   * @type {number | null}
   */
  @state()
  _dragValue = null;

  /** @param {InputEvent & { target: HTMLInputElement }} ev */
  _onInput(ev) {
    this._dragValue = parseFloat(ev.target.value);
  }

  /** @param {Event & { target: HTMLInputElement }} ev */
  _onChange(ev) {
    const value = parseFloat(ev.target.value);
    this._dragValue = null;
    this.value = value;
    this.dispatchEvent(new CustomEvent('seek', { detail: { value } }));
  }

  render() {
    const value = this._dragValue ?? this.value;
    return html`
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        aria-label=${this.label}
        .value=${String(value)}
        style="--progress: ${value * 100}%; --page-width: ${100 / Math.max(1, this.pages)}%"
        @input=${this._onInput}
        @change=${this._onChange}
      />
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* Dark track, so it stands out from the toolbar's grey */
      --track-color: #1c1c1c;
      --fill-color: #dcdcdc;
      --thumb-color: #fff;
      /* Roughly the toolbar's grey, so dividers read as gaps on both the
         light (read) and dark (unread) parts */
      --page-divider-color: rgba(68, 68, 68, 0.5);
    }

    input {
      display: block;
      width: 100%;
      height: 14px;
      margin: 0;
      background: transparent;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    }

    input:focus {
      outline: none;
    }

    /* A soft line at the end of each page, over the read/unread fill */
    input::-webkit-slider-runnable-track {
      height: 3px;
      border-radius: 1.5px;
      background:
        repeating-linear-gradient(to right,
          transparent 0 calc(var(--page-width) - 3px),
          var(--page-divider-color) calc(var(--page-width) - 1.5px),
          transparent var(--page-width)),
        linear-gradient(to right, var(--fill-color) var(--progress), var(--track-color) var(--progress));
    }

    /* Same as webkit; -moz-range-progress would only span the read part, misaligning the dividers */
    input::-moz-range-track {
      height: 3px;
      border-radius: 1.5px;
      background:
        repeating-linear-gradient(to right,
          transparent 0 calc(var(--page-width) - 3px),
          var(--page-divider-color) calc(var(--page-width) - 1.5px),
          transparent var(--page-width)),
        linear-gradient(to right, var(--fill-color) var(--progress), var(--track-color) var(--progress));
    }

    input::-webkit-slider-thumb {
      width: 10px;
      height: 10px;
      /* (track height - thumb height) / 2 */
      margin-top: -3.5px;
      border: 0;
      border-radius: 50%;
      background: var(--thumb-color);
      -webkit-appearance: none;
      transition: transform 0.1s;
    }

    input::-moz-range-thumb {
      width: 10px;
      height: 10px;
      border: 0;
      border-radius: 50%;
      background: var(--thumb-color);
      transition: transform 0.1s;
    }

    input:hover::-webkit-slider-thumb,
    input:focus-visible::-webkit-slider-thumb {
      transform: scale(1.3);
    }

    input:hover::-moz-range-thumb,
    input:focus-visible::-moz-range-thumb {
      transform: scale(1.3);
    }
  `;
}
