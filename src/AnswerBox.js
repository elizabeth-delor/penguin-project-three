import { I18NMixin } from '@lrnwebcomponents/i18n-manager/lib/I18NMixin.js';

import { html, css } from 'lit';
import { SimpleColors } from '@lrnwebcomponents/simple-colors';

export class AnswerBox extends I18NMixin(SimpleColors) {
  static get tag() {
    return 'answer-box';
  }

  constructor() {
    super();
    this.back = false;
    this.correct = false;
    this.showResult = false;
    this.statusIcon = '';
    this.sideToShow = 'front';
    this.userAnswer = '';
    this.t = {
      yourAnswer: 'Your answer',
      checkAnswer: 'Check answer',
      restartActivity: 'Restart activity',
    };
    this.registerLocalization({
      context: this,
      localesPath: new URL('../locales/', import.meta.url).href,
      locales: ['es', 'fr'],
    });
    this.speech = new SpeechSynthesisUtterance();
    this.speech.lang = navigator.language.substring(0, 2); // uses language of the browser
    this.i18store = window.I18NManagerStore.requestAvailability();
    this.speech.lang = this.i18store.lang;
  }

  static get properties() {
    return {
      ...super.properties,
      back: { type: Boolean, reflect: true },
      sideToShow: { type: String, reflect: true, attribute: 'side-to-show' },
      userAnswer: { type: String, attribute: 'user-answer' },
      correct: { type: Boolean, reflect: true },
      showResult: { type: Boolean, attribute: 'show-result', reflect: true },
      statusIcon: { type: String, attribute: false },
    };
  }

  updated(changedProperties) {
    if (super.updated) {
      super.updated(changedProperties);
      changedProperties.forEach((oldValue, propName) => {
        if (propName === 't') {
          this.i18store = window.I18NManagerStore.requestAvailability();
          this.speech.lang = this.i18store.lang;
          console.log(this.speech.lang);
        }
      });
    }
    changedProperties.forEach((oldValue, propName) => {
      if (propName === 'correct') {
        this.statusIcon = this[propName]
          ? 'icons:check-circle'
          : 'icons:cancel';
      }
      if (propName === 'back') {
        this.sideToShow = this[propName] ? 'back' : 'front';
      }
      if (propName === 'showResult' && this[propName]) {
        import('@lrnwebcomponents/simple-icon/lib/simple-icon-lite.js');
        import('@lrnwebcomponents/simple-icon/lib/simple-icons.js');
      }
    });
  }

  firstUpdated(changedProperties) {
    if (super.firstUpdated) {
      super.firstUpdated(changedProperties);
    }
    const btn = this.shadowRoot.querySelector('#check');
    this.shadowRoot
      .querySelector('#answer')
      .addEventListener('keyup', event => {
        if (event.keyCode === 13) {
          event.preventDefault();
          btn.click();
        }
      });
  }

  // Need this instead of .toUpperCase() for i18n
  equalsIgnoringCase(text) {
    return (
      text.localeCompare(this.userAnswer, undefined, {
        sensitivity: 'base',
      }) === 0
    );
  }

  // Use data-correct-answer so that parent elements will be able to
  // know if the answer was correct or incorrect
  // We might need to add an incorrect data attribute not sure yet......
  checkUserAnswer() {
    const side = this.back ? 'front' : 'back';
    const comparison = this.shadowRoot
      .querySelector(`[name="${side}"]`)
      .assignedNodes({ flatten: true })[0]
      .querySelector(`[name="${side}"]`)
      .assignedNodes({ flatten: true })[0].innerText;
    this.speech.text = comparison;
    window.speechSynthesis.speak(this.speech);
    this.correct = this.equalsIgnoringCase(comparison);
    this.showResult = true;
    // reverse so that it swaps which slot is shown
    this.sideToShow = !this.back ? 'back' : 'front';
  }

  // as the user types input, grab the value
  // this way we can react to disable state among other things
  inputChanged(e) {
    this.userAnswer = e.target.value;
  }

  // reset the interaction to the defaults
  resetCard() {
    this.userAnswer = '';
    this.correct = false;
    this.showResult = false;
    this.sideToShow = this.back ? 'back' : 'front';
  }

  // CSS - specific to Lit
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .answer-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 300px;
        border-radius: 20px;
        border: solid 1px gray;
        background-color: var(--simple-colors-default-theme-accent-7);
        padding: 0;
      }
      .answer-section:focus-within {
        border-color: #9ecaed;
        box-shadow: 0 0 10px #9ecaed;
      }
      input {
        border: none;
        padding: 10px;
        font-size: 14px;
        height: 42px;
        border-radius: 19px 0 0 19px;
        margin: 0;
        width: 11em;
      }
      input:focus {
        outline: none;
      }
      button#check {
        background-color: #0a7694;
        color: white;
        font-size: 14px;
        margin: none;
        padding: 14px;
        border-radius: 0 19px 19px 0;
        border: none;
        overflow: hidden;
        width: 50em;
        height: 62px;
      }
      button:hover {
        opacity: 0.8;
      }
      button:disabled {
        opacity: 0.5;
        background-color: #dddddd;
        color: black;
      }
      p {
        font-family: Helvetica;
        color: var(--simple-colors-default-theme-grey-12);
        font-weight: normal;
        font-size: 20px;
      }
      :host([side-to-show='front']) slot[name='back'] {
        display: none;
      }
      :host([side-to-show='back']) slot[name='front'] {
        display: none;
      }

      :host([correct]) simple-icon-lite {
        color: green;
      }
      simple-icon-lite {
        --simple-icon-width: 50px;
        --simple-icon-height: 50px;
        color: red;
      }

      .sr-only {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;
  }

  // HTML - specific to Lit
  render() {
    return html`
      <p id="question">
        <slot name="front"></slot>
        <slot name="back"></slot>
      </p>
      <div class="answer-section">
        <input
          id="answer"
          type="text"
          .placeholder="${this.t.yourAnswer}"
          @input="${this.inputChanged}"
          .value="${this.userAnswer}"
        />
        <button
          id="check"
          ?disabled="${this.userAnswer === ''}"
          @click="${this.checkUserAnswer}"
        >
          ${this.t.checkAnswer}
        </button>
      </div>
      ${this.showResult
        ? html`<simple-icon-lite icon="${this.statusIcon}"></simple-icon-lite>
            <button id="retry" @click="${this.resetCard}">
              ${this.t.restartActivity}
            </button>`
        : ``}
    `;
  }
}

customElements.define(AnswerBox.tag, AnswerBox);
