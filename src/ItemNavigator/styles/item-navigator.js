import { css } from 'lit-element';

const subnavWidth = css`320px`;
const tabletPlusQuery = css`@media (min-width: 640px)`;

export default css`
#frame {
  position: relative;
  overflow: hidden;
}

#frame.fullscreen,
#frame.fullscreen #reader {
  height: 100vh;
}

button {
  cursor: pointer;
  padding: 0;
  border: 0;
}

button:focus,
button:active {
  outline: none;
}

nav button {
  background: none;
}

nav .minimized {
  background: rgba(0, 0, 0, .7);
  border-bottom-right-radius: 5%;
  position: absolute;
  top: 0;
  left: 0;
  width: 4rem;
  z-index: 2;
}

nav .minimized button {
  width: var(--iconWidth);
  height: var(--iconHeight);
  margin: auto;
  display: inline-flex;
  vertical-align: middle;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
}

nav .minimized button.toggle-menu > * {
  border: 2px solid var(--iconStrokeColor);
  border-radius: var(--iconWidth);
  width: var(--iconWidth);
  height: var(--iconHeight);
  margin: auto;
}

#menu {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  width: 1px;
  overflow: hidden;
  transition: width 300ms ease-out;
  transform: translateX(-${subnavWidth});
}

#reader {
  position: relative;
  z-index: 1;
  transition: transform 300ms ease-out;
  transform: translateX(0);
  width: 100%;
}

.open #menu {
  width: ${subnavWidth};
  transform: translateX(0);
}

${tabletPlusQuery} {
  .open #reader {
    transform: translateX(${subnavWidth});
    width: calc(100% - ${subnavWidth});
  }
}

#loading-indicator {
  display: none;
}

#loading-indicator.visible {
  display: block;
}
`;
