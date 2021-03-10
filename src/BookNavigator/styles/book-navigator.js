import { css } from 'lit-element';

export default css`
  #book-navigator.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 30vh;
  }

  #book-navigator .book-loader {
    width: 30%;
    margin: auto;
    text-align: center;
    color: var(--primaryTextColor);
  }

  .book-loader svg {
    display: block;
    width: 60%;
    max-width: 100px;
    height: auto;
    margin: auto;
  }

  svg * {
    fill: var(--primaryTextColor);
  }

  svg .ring {
    animation: rotate 1.3s infinite linear;
    transform-origin: 50px 50px;
    transform-box: fill-box;
  }

  @keyframes rotate {
    0% {
      transform: rotate(-360deg);
    }
  }
`;