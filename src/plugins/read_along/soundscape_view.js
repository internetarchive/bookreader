// @ts-check
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import { SoundscapePlayer, resolveQuoteSpan } from './soundscape.js';
/** @typedef {import('./soundscape.js').SoundAction} SoundAction */
/** @typedef {import('./soundscape.js').CueSpec} CueSpec */
/** @typedef {import('./plugin.read_along.js').ReadAlongPlugin} ReadAlongPlugin */

const ACTION_ICONS = {
  play: '▶',
  volume: '🔊',
  stop: '■',
  stopAll: '■',
  css: '✦',
};

/** Seconds a looping sound plays for when previewed */
const LOOP_PREVIEW_LENGTH = 5;

/**
 * Shows a soundscape's cues on the pages: each quote highlighted, with a pin
 * on its anchor word that previews the cue's sounds on hover.
 */
export class SoundscapeView {
  active = false;

  /**
   * @param {ReadAlongPlugin} plugin
   */
  constructor(plugin) {
    this.plugin = plugin;
    this.br = plugin.br;
    /** Separate from the read-along player, so previews don't disturb it */
    this.previewPlayer = new SoundscapePlayer(plugin.soundscape, this.br.refs.$br[0]);
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      // Called from a click, so audio is allowed to start
      this.previewPlayer.unlock();
      for (const container of this.br.getActivePageContainerElements()) this.render(container);
    } else {
      this.previewPlayer.stopAll(0.2);
      $(this.br.getActivePageContainerElements()).find('.soundscapeQuoteLayer, .BRsoundscapePins').remove();
    }
  }

  /**
   * @param {HTMLElement} container a page container
   */
  async render(container) {
    const pageIndex = parseFloat(container.getAttribute('data-index'));
    const cues = this.plugin.soundscape.cues.filter(c => c.at.pageIndex === pageIndex);
    if (!this.active || !cues.length) return;
    const words = await this.plugin.getPageWords(pageIndex);
    if (!this.active || container.querySelector('.BRsoundscapePins')) return;

    const page = this.br.book.getPage(pageIndex);
    const norms = words.map(w => w.norm);
    const pinsEl = document.createElement('div');
    pinsEl.className = 'BRsoundscapePins';
    /** @type {Array<{ l: number, r: number, b: number, t: number }>} */
    const boxes = [];
    /** @type {string[]} */
    const boxClasses = [];
    /** @type {Map<string, number>} pins so far per line, to stack them */
    const pinsPerLine = new Map();
    for (const cue of cues) {
      const span = resolveQuoteSpan(norms, cue.at.quote);
      if (!span) continue;
      const anchorIndex = cue.at.position == 'end' ? span.end : span.start;
      for (let i = span.start; i <= span.end; i++) {
        for (const box of words[i].boxes) {
          boxes.push(box);
          boxClasses.push(i == anchorIndex ? 'anchor' : '');
        }
      }
      const anchorBox = words[anchorIndex].boxes[0];
      const lineKey = words[anchorIndex].lineKey;
      const stack = pinsPerLine.get(lineKey) ?? 0;
      pinsPerLine.set(lineKey, stack + 1);
      const pin = this._renderPin(cue, {
        left: `${(anchorBox.l + anchorBox.r) / 2 / page.width * 100}%`,
        top: `${anchorBox.t / page.height * 100}%`,
      });
      pin.style.setProperty('--stack', `${stack}`);
      pinsEl.appendChild(pin);
    }
    renderBoxesInPageContainerLayer('soundscapeQuoteLayer', boxes, page, container, boxClasses);
    container.appendChild(pinsEl);
  }

  /**
   * @param {CueSpec} cue
   * @param {{ left: string, top: string }} position
   */
  _renderPin(cue, { left, top }) {
    const pin = document.createElement('div');
    pin.className = 'BRsoundscapePin';
    pin.style.left = left;
    pin.style.top = top;

    const head = document.createElement('div');
    head.className = 'BRsoundscapePin__head';
    head.title = `"${cue.at.quote}"\n` + cue.actions.map(describeAction).join('\n');
    for (const action of cue.actions) {
      const item = document.createElement('span');
      item.className = `BRsoundscapePin__action BRsoundscapePin__action--${action.action}`;
      item.textContent = `${ACTION_ICONS[action.action] ?? '?'} ${action.sound ?? action.class ?? ''}`.trim();
      head.appendChild(item);
    }
    head.addEventListener('mouseenter', () => this.preview(cue));
    head.addEventListener('mouseleave', () => this.previewPlayer.stopAll(0.3));
    pin.appendChild(head);
    return pin;
  }

  /**
   * Play the sounds a cue touches, and apply its css effects. Stops play the
   * sound and fade it out, so you hear what's being stopped.
   * @param {CueSpec} cue
   */
  preview(cue) {
    const player = this.previewPlayer;
    player.stopAll(0.1);
    for (const action of cue.actions) {
      const { sound, volume = 1, fade = 0, delay = 0 } = action;
      if (action.action == 'css') {
        if (!action.remove) player.run({ ...action, duration: action.duration ?? 2 });
        continue;
      }
      if (!sound) continue;
      const isStop = action.action == 'stop';
      player.run({ action: 'play', sound, volume: isStop ? 1 : volume, fade: isStop ? 0 : fade, delay });
      if (isStop) {
        player.run({ action: 'stop', sound, fade: Math.max(fade, 1), delay: delay + 1 });
      } else if (this.plugin.soundscape.sounds[sound]?.loop) {
        player.run({ action: 'stop', sound, fade: 1, delay: delay + LOOP_PREVIEW_LENGTH });
      }
    }
  }
}

/**
 * @param {SoundAction} action
 */
function describeAction(action) {
  const parts = [action.action, action.sound ?? action.class];
  if (action.volume != null) parts.push(`volume ${action.volume}`);
  if (action.fade) parts.push(`fade ${action.fade}s`);
  if (action.delay) parts.push(`delay ${action.delay}s`);
  if (action.duration) parts.push(`for ${action.duration}s`);
  if (action.remove) parts.push('remove');
  return parts.filter(Boolean).join(' ');
}
