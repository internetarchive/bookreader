import { css } from 'lit-element';

export default css`
:host {
  display: block;
  height: 100%;
  padding: 1.5rem 0;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: center;
  padding: 0 2rem;
}

h2 {
  font-size: 1.6rem;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 1.4rem;
}

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

header div {
  display: flex;
  align-items: baseline;
}

a.close {
  justify-self: end;
}

a.close ia-icon {
  --iconWidth: 18px;
  --iconHeight: 18px;
}

ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

li,
ul + p {
  padding-bottom: 1.2rem;
  font-size: 1.2rem;
  line-height: 140%;
}

p {
  margin: .3rem 0 0 0;
}

.button {
  display: inline-block;
  padding: .6rem 1rem;
  font-size: 1.4rem;
  text-decoration: none;
  text-shadow: 1px 1px #484848;
  border-radius: 4px;
  color: var(--downloadButtonColor);
  background: var(--downloadButtonBg);
  border: 1px solid var(--downloadButtonBorderColor);
}

.external {
  color: var(--externalButtonColor);
  text-shadow: none;
  background: var(--externalButtonBg);
  border: 1px solid var(--externalButtonBorderColor);
}
`;
