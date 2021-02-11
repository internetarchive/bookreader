import { css } from 'lit-element';
import checkmarkIcon from './icon_checkmark.js';
import closeIcon from './icon_close.js';

export default css`
:host {
  display: block;
  height: 100%;
  padding: 1.5rem 1rem 2rem 0;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: center;
  padding: 0 2rem 0 0;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 2rem;
}

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

fieldset {
  padding: 0 0 1rem 0;
  border: none;
}

[type="checkbox"] {
  display: none;
}

label {
  display: block;
  text-align: center;
}

label.checkbox {
  padding-bottom: .5rem;
  font-size: 1.6rem;
  line-height: 150%;
  vertical-align: middle;
}

label.checkbox:after {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: .7rem;
  content: "";
  border: 1px solid var(--primaryTextColor);
  border-radius: 2px;
  background: var(--activeButtonBg) 50% 50% no-repeat;
}
:checked + label.checkbox:after {
  background-image: url('${checkmarkIcon}');
}

[type="search"] {
  -webkit-appearance: textfield;
  width: 100%;
  height: 3rem;
  padding: 0 1.5rem;
  box-sizing: border-box;
  font: normal 1.6rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: 1px solid var(--primaryTextColor);
  border-radius: 1.5rem;
  background: transparent;
}
[type="search"]:focus {
  outline: none;
}
[type="search"]::-webkit-search-cancel-button {
  width: 18px;
  height: 18px;
  -webkit-appearance: none;
  appearance: none;
  -webkit-mask: url('${closeIcon}') 0 0 no-repeat;
  mask: url('${closeIcon}') 0 0 no-repeat;
  -webkit-mask-size: 100%;
  mask-size: 100%;
  background: #fff;
}

p.page-num {
  font-weight: bold;
  padding-bottom: 0;
}

p.search-cta {
  text-align: center;
}

.results-container {
  padding-bottom: 2rem;
}

ul {
  padding: 0 0 2rem 0;
  margin: 0;
  list-style: none;
}

ul.show-image li {
  display: grid;
}

li {
  cursor: pointer;
  grid-template-columns: 30px 1fr;
  grid-gap: 0 .5rem;
}

li img {
  display: block;
  width: 100%;
}

li h4 {
  grid-column: 2 / 3;
  padding: 0 0 2rem 0;
  margin: 0;
  font-weight: normal;
}

li p {
  grid-column: 2 / 3;
  padding: 0 0 1.5rem 0;
  margin: 0;
  font-size: 1.2rem;
}

mark {
  padding: 0 .2rem;
  color: var(--searchResultText);
  background: var(--searchResultBg);
  border: 1px solid var(--searchResultBorder);
  border-radius: 2px;
}

.loading {
  text-align: center;
}

.loading p {
  padding: 0 0 1rem 0;
  margin: 0;
  font-size: 1.2rem;
}

.loading button {
  -webkit-appearance: none;
  appearance: none;
  padding: .5rem .7rem;
  font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: 1px solid #656565;
  border-radius: 3px;
  cursor: pointer;
  background: transparent;
}

ia-activity-indicator {
  display: block;
  width: 40px;
  height: 40px;
  margin: 0 auto;
}
`;
