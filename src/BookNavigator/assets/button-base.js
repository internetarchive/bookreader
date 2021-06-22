import { css } from 'lit-element';

export default css`
  .ia-button {
    min-height: 3rem;
    border: none;
    outline: none;
    cursor: pointer;
    color: var(--primaryTextColor);
    line-height: normal;
    border-radius: .4rem;
    text-align: center;
    vertical-align: middle;
    font-size: 1.4rem;
    display: inline-block;
    padding: .6rem 1.2rem;
    border: 1px solid transparent;

    white-space: nowrap;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -o-user-select: none;
    user-select: none;
  }

  .ia-button.link,
  .ia-button.external {
    min-height: unset;
    text-decoration: none;
  }

  .ia-button:disabled,
  .ia-button.disabled {
    cursor: not-allowed;
    background-color: var(--primaryDisableCTAFill);
    border: 1px solid var(--secondaryCTABorder);
    color: var(--primaryTextColor);
  }

  .ia-button.transparent {
    background-color: transparent;
  }
  
  .ia-button.slim {
    padding: 0;
  }


  .ia-button.primary {
    background-color: var(--primaryCTAFill);
    border-color: var(--primaryCTABorder);
  }
  .ia-button.primary:hover {
    background-color: rgba(var(--primaryCTAFillRGB), 0.9);
  }
  .ia-button.primary:focus {
    background-color: rgba(var(--primaryCTAFillRGB), 0.8);
  }
  .ia-button.primary:active {
    background-color: rgba(var(--primaryCTAFillRGB), 0.7);
  }


  .ia-button.cancel {
    background-color: var(--primaryErrorCTAFill);
    border-color: var(--primaryErrorCTABorder);
  }
  .ia-button.cancel:hover {
    background-color: rgba(var(--primaryErrorCTAFillRGB), 0.9);
  }
  .ia-button.cancel:focus {
    background-color: rgba(var(--primaryErrorCTAFillRGB), 0.8);
  }
  .ia-button.cancel:active {
    background-color: rgba(var(--primaryErrorCTAFillRGB), 0.7);
  }


  .ia-button.external {
    background-color: var(--secondaryCTAFill);
    border-color: var(--secondaryCTABorder);
  }
  .ia-button.external:hover {
    background-color: rgba(var(--secondaryCTAFillRGB), 0.9);
  }
  .ia-button.external:focus {
    background-color: rgba(var(--secondaryCTAFillRGB), 0.8);
  }
  .ia-button.external:active {    
    background-color: rgba(var(--secondaryCTAFillRGB), 0.7);
  }
`;
