// @ts-check
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import { SoundscapePlayer, effectStateAt, loopStateAt, resolveCues, resolveQuoteSpan, volumeDirections } from './soundscape.js';
/** @typedef {import('./soundscape.js').SoundAction} SoundAction */
/** @typedef {import('./soundscape.js').CueSpec} CueSpec */
/** @typedef {import('./plugin.read_along.js').ReadAlongPlugin} ReadAlongPlugin */
/** @typedef {import('./plugin.read_along.js').BookWord} BookWord */

/**
 * @typedef {object} PinContext
 * @property {number} pageIndex
 * @property {BookWord[]} words the page's words
 * @property {{ start: number, end: number }} span the quote's words
 * @property {number} anchorIndex
 * @property {Map<SoundAction, 'up' | 'down'>} directions of the `set`s, from `volumeDirections`
 */

/** Starts and stops are shown by styling instead (stops are struck through) */
const VERB_ICONS = {
  set: '✎',
};

/**
 * Crescendo/diminuendo hairpins, for `set`s that change volume. Drawn rather
 * than using the Unicode musical symbols, which few fonts have.
 * @param {string} points
 */
const hairpin = points => `<svg class="BRsoundscapeHairpin" viewBox="0 0 8 9" width="8" height="9" aria-hidden="true">` +
  `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const VOLUME_ICONS = {
  up: hairpin('7.25,1 0.75,4.5 7.25,8'),
  down: hairpin('0.75,1 7.25,4.5 0.75,8'),
};

const TARGET_ICONS = {
  // A music note, as on the toolbar button
  sound: '<svg class="BRsoundscapeNote" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">' +
    '<path fill="currentColor" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>',
  effect: '✦',
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
      this.closeDetails();
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
    const directions = volumeDirections(resolveCues(this.plugin.soundscape, new Map([[pageIndex, norms]])));
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
      }, { pageIndex, words, span, anchorIndex, directions });
      pin.style.setProperty('--stack', `${stack}`);
      pinsEl.appendChild(pin);
    }
    renderBoxesInPageContainerLayer('soundscapeQuoteLayer', boxes, page, container, boxClasses);
    container.appendChild(pinsEl);
  }

  /**
   * @param {CueSpec} cue
   * @param {{ left: string, top: string }} position
   * @param {PinContext} context
   */
  _renderPin(cue, { left, top }, context) {
    const pin = document.createElement('div');
    pin.className = 'BRsoundscapePin';
    pin.style.left = left;
    pin.style.top = top;

    const head = document.createElement('div');
    head.className = 'BRsoundscapePin__head';
    head.title = `"${cue.at.quote}"\n` + cue.actions.map(describeAction).join('\n');
    for (const action of cue.actions) {
      const item = document.createElement('span');
      item.className = `BRsoundscapePin__action BRsoundscapePin__action--${action.action} BRsoundscapePin__action--${targetType(action)}`;
      item.innerHTML = actionLabelHtml(action, context.directions.get(action));
      head.appendChild(item);
    }
    head.addEventListener('mouseenter', () => this.preview(cue));
    head.addEventListener('mouseleave', () => this.previewPlayer.stopAll(0.3));
    head.addEventListener('click', ev => {
      ev.stopPropagation();
      this.showDetails(cue, context, head);
    });
    // 2up flips the page on mouseup, so keep presses on pins to themselves
    for (const type of ['mousedown', 'mouseup', 'pointerdown', 'pointerup']) {
      head.addEventListener(type, ev => ev.stopPropagation());
    }
    pin.appendChild(head);
    return pin;
  }

  /**
   * Open the side panel with a cue's details
   * @param {CueSpec} cue
   * @param {PinContext} context
   * @param {HTMLElement} head the pin head that was clicked
   */
  showDetails(cue, { pageIndex, words, span, anchorIndex, directions }, head) {
    const spec = this.plugin.soundscape;
    this.closeDetails();
    head.classList.add('BRsoundscapePin__head--selected');
    this._selectedHead = head;

    const quoteHtml = words.slice(span.start, span.end + 1).map((w, i) =>
      span.start + i == anchorIndex ? `<mark>${escapeHtml(w.text)}</mark>` : escapeHtml(w.text)).join(' ');

    // What's playing once this cue has fired. Cues on other pages only need
    // their page to be ordered, so only this page's need resolving.
    const resolved = resolveCues(spec, new Map([[pageIndex, words.map(w => w.norm)]]));
    const loops = loopStateAt(spec, resolved, pageIndex, anchorIndex);
    const effects = effectStateAt(resolved, pageIndex, anchorIndex);

    const panel = document.createElement('aside');
    panel.className = 'BRsoundscapePanel';
    panel.innerHTML = `
      <header>
        <h3>Cue on page index ${pageIndex}${this.br.book.getPage(pageIndex).pageNumString ? ` (p. ${escapeHtml(this.br.book.getPage(pageIndex).pageNumString)})` : ''}</h3>
        <button type="button" class="BRsoundscapePanel__close" title="Close">×</button>
      </header>
      <div class="BRsoundscapePanel__main">
        <section>
          <blockquote>${quoteHtml}</blockquote>
          <div class="BRsoundscapePanel__meta">quote: "${escapeHtml(cue.at.quote)}" · fires on the ${cue.at.position == 'end' ? 'last' : 'first'} word</div>
        </section>
        <section>
          <h4>Actions</h4>
          ${cue.actions.map((action, i) => this._renderActionDetails(action, i, directions.get(action))).join('')}
        </section>
        <section>
          <h4>After this cue</h4>
          <div>Looping: ${loops.size ? [...loops].map(([name, v]) => `<code>${escapeHtml(name)}</code> @ ${v}`).join(', ') : 'nothing'}</div>
          <div>Effects: ${effects.size ? [...effects].map(e => `<code>${escapeHtml(e)}</code>`).join(', ') : 'none'}</div>
        </section>
      </div>
    `;
    panel.querySelector('.BRsoundscapePanel__close').addEventListener('click', () => this.closeDetails());
    for (const pill of panel.querySelectorAll('.BRsoundscapePanel__resource')) {
      pill.addEventListener('click', () => {
        for (const p of panel.querySelectorAll('.BRsoundscapePanel__resource')) p.classList.toggle('selected', p === pill);
        this._showResource(panel, pill.getAttribute('data-resource-type'), pill.getAttribute('data-resource-name'));
      });
    }
    for (const button of panel.querySelectorAll('[data-preview-action]')) {
      button.addEventListener('click', () => {
        const action = cue.actions[parseFloat(button.getAttribute('data-preview-action'))];
        this.preview({ ...cue, actions: [action] });
      });
    }
    this._onKeydown = (/** @type {KeyboardEvent} */ ev) => { if (ev.key == 'Escape') this.closeDetails(); };
    document.addEventListener('keydown', this._onKeydown);
    this._panel = panel;
    // A sidebar beside the reader, which resizes itself to the narrower body
    document.body.classList.add('BRsoundscapePanel-open');
    document.body.appendChild(panel);
  }

  closeDetails() {
    this._panel?.remove();
    this._panel = null;
    document.body.classList.remove('BRsoundscapePanel-open');
    this._selectedHead?.classList.remove('BRsoundscapePin__head--selected');
    this._selectedHead = null;
    if (this._onKeydown) document.removeEventListener('keydown', this._onKeydown);
    this._onKeydown = null;
    this.previewPlayer.stopAll(0.3);
  }

  /**
   * Show a sound's or effect's definition in a section at the bottom of the panel
   * @param {HTMLElement} panel
   * @param {string} type 'sound' or 'effect'
   * @param {string} name
   */
  _showResource(panel, type, name) {
    panel.querySelector('.BRsoundscapePanel__resourceDetails')?.remove();
    const spec = this.plugin.soundscape;
    const resource = type == 'sound' ? spec.sounds[name] : spec.effects?.[name];
    /** @type {Array<[string, string]>} label, html */
    const rows = !resource ? [['', `No ${type} named <code>${escapeHtml(name)}</code> in this soundscape`]] :
      type == 'sound' ? [
        ['file', `<a href="${escapeHtml(resource.src)}" target="_blank" rel="noopener">${escapeHtml(resource.src.split('/').pop())}</a>`],
        ['loop', resource.loop ? `yes${resource.loopStart != null || resource.loopEnd != null ? ` (${resource.loopStart ?? 0}s–${resource.loopEnd != null ? `${resource.loopEnd}s` : 'end'})` : ''}` : 'no (one-shot)'],
        ['start', resource.start != null && `${resource.start}s`],
        ['end', resource.end != null && `${resource.end}s${resource.fadeOut ? ` (fading out over ${resource.fadeOut}s)` : ''}`],
        ['gain', resource.gain != null && `${resource.gain}`],
        ['credit', resource.credit && linkify(resource.credit)],
      ] : [
        ['css', `<pre>${escapeHtml([resource.css ?? []].flat().join('\n'))}</pre>`],
      ];
    const section = document.createElement('section');
    section.className = 'BRsoundscapePanel__resourceDetails';
    section.innerHTML = `
      <div class="BRsoundscapePanel__actionTitle">
        <h4>${TARGET_ICONS[type]} ${escapeHtml(type)} <code>${escapeHtml(name)}</code></h4>
        ${resource ? '<button type="button" title="Preview">▶ preview</button>' : ''}
      </div>
      <dl>${rows.filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    section.querySelector('button')?.addEventListener('click', () => {
      this.preview({ at: null, actions: [type == 'sound' ? { action: 'start', sound: name } : { action: 'start', effect: name }] });
    });
    panel.appendChild(section);
  }

  /**
   * @param {SoundAction} action
   * @param {number} index
   * @param {'up' | 'down'} [direction] for `set`s that change volume
   */
  _renderActionDetails(action, index, direction) {
    const canPreview = action.sound || (action.effect && action.action == 'start');
    const rows = [
      ['volume', action.volume],
      ['fade', action.fade != null && `${action.fade}s`],
      ['delay', action.delay != null && `${action.delay}s`],
      ['duration', action.duration != null && `${action.duration}s`],
    ].filter(([, v]) => v != null && v !== false);
    return `
      <div class="BRsoundscapePanel__action">
        <div class="BRsoundscapePanel__actionTitle">
          <span>
            ${verbIcon(action, direction)} <b>${escapeHtml(action.action)}</b>
            ${action.sound || action.effect ? `
              <button type="button" class="BRsoundscapePanel__resource BRsoundscapePin__action--${action.action} BRsoundscapePin__action--${targetType(action)}"
                data-resource-type="${targetType(action)}" data-resource-name="${escapeHtml(targetName(action))}" title="Show ${targetType(action)} details">
                ${TARGET_ICONS[targetType(action)]} <span class="BRsoundscapePin__name">${escapeHtml(targetName(action))}</span>
              </button>` : `<code>${escapeHtml(targetName(action))}</code>`}
          </span>
          ${canPreview ? `<button type="button" data-preview-action="${index}" title="Preview">▶ preview</button>` : ''}
        </div>
        ${rows.length ? `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v))}</dd>`).join('')}</dl>` : ''}
      </div>`;
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
      const { sound, effect, volume = 1, fade = 0, delay = 0 } = action;
      if (effect) {
        if (action.action == 'start') player.run({ ...action, duration: action.duration ?? 2 });
        continue;
      }
      if (!sound) continue;
      const isStop = action.action == 'stop';
      player.run({ action: 'start', sound, volume: isStop ? 1 : volume, fade: isStop ? 0 : fade, delay });
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
  const parts = [action.action, targetType(action), targetName(action)];
  if (action.volume != null) parts.push(`volume ${action.volume}`);
  if (action.fade) parts.push(`fade ${action.fade}s`);
  if (action.delay) parts.push(`delay ${action.delay}s`);
  if (action.duration) parts.push(`for ${action.duration}s`);
  return parts.filter(Boolean).join(' ');
}

/**
 * @param {SoundAction} action
 * @returns {'sound' | 'effect' | 'all'}
 */
function targetType(action) {
  return action.sound ? 'sound' : action.effect ? 'effect' : 'all';
}

/**
 * @param {SoundAction} action
 */
function targetName(action) {
  return action.sound ?? action.effect ?? 'everything';
}

/**
 * e.g. "🔊 rain"; stops are struck through by CSS
 * @param {SoundAction} action
 * @param {'up' | 'down'} [direction] for `set`s that change volume
 */
function actionLabelHtml(action, direction) {
  return `${verbIcon(action, direction)}${TARGET_ICONS[targetType(action)] ?? ''} ` +
    `<span class="BRsoundscapePin__name">${escapeHtml(targetName(action))}</span>`;
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

/**
 * Escape, and turn URLs into links
 * @param {string} s
 */
function linkify(s) {
  return escapeHtml(s).replace(/https?:\/\/[^\s<]+/g, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

/**
 * @param {SoundAction} action
 * @param {'up' | 'down'} [direction] for `set`s that change volume
 */
function verbIcon(action, direction) {
  return (direction && VOLUME_ICONS[direction]) ?? VERB_ICONS[action.action] ?? '';
}
