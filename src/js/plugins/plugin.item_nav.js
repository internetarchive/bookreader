import { html, render } from "lit-html";

const bookReaderTemplate = () =>
  html`
    <style>
      #bookreader-container {
        background-color: #000000;
        position: relative;
        width: 100vw;
        height: 80vh;
      }
      .BookReader {
        width: 100%;
      }
    </style>
    <div id="theatre-ia-wrap" class="container container-ia width-max">
      <div id="theatre-ia" class="width-max">
        <div class="row">
          <div id="IABookReaderMessageWrapper" style="display:none;"></div>
          <div id="BookReader" class="BookReader"></div>
        </div>
      </div>
    </div>
  `;

// Render the template to the document
render(bookReaderTemplate(), document.querySelector("#bookreader-container"));
