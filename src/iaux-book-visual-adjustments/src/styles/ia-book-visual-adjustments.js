import { css } from 'lit-element';
import checkmarkIcon from './icon_checkmark.js';

export default css`
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: baseline;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 1.6rem;
}

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

ul {
  padding: 1rem 2rem 0 0;
  list-style: none;
  margin-top: 0;
}

[type="checkbox"] {
  display: none;
}

label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 150%;
  vertical-align: middle;
}

.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: .7rem;
  border: 1px solid var(--primaryTextColor);
  border-radius: 2px;
  background: var(--activeButtonBg) 50% 50% no-repeat;
}
:checked + .icon {
  background-image: url('${checkmarkIcon}');
}

.range {
  display: none;
  padding-top: .5rem;
}
.range.visible {
  display: flex;
}

.range p {
  margin-left: 1rem;
}

h4 {
  padding: 1rem 0;
  margin: 0;
  font-size: 1.4rem;
}

button {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  border-radius: 0;
  background: transparent;
  outline: none;
  cursor: pointer;
  --iconFillColor: var(--primaryTextColor);
  --iconStrokeColor: var(--primaryTextColor);
  height: 4rem;
  width: 4rem;
}

button * {
  display: inline-block;
}
`;
