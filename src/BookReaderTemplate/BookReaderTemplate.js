import { html, render } from "lit-html";

const sampleJson = require("./sample.json");
const encJson = btoa(JSON.stringify(sampleJson));

import "../BookNavigator/BookNavigator.js";
import "../ItemNavigator/ItemNavigator.js";

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

      item-navigator {
        display: block;
        width: 100%;
        --menuButtonLabelDisplay: block;
        --menuSliderBg: #151515;
        --subpanelRightBorderColor: #999;
        --activeButtonBg: #282828;
        --primaryTextColor: #fff;
        --menuWidth: 32rem;
        --animationTiming: 100ms;
        --iconFillColor: #fff;
        --iconStrokeColor: #fff;
        --menuSliderHeaderIconHeight: 2rem;
        --menuSliderHeaderIconWidth: 2rem;
        --iconWidth: 2.4rem;
        --iconHeight: 2.4rem;
        --searchResultText: #adaedc;
        --searchResultBg: #272958;
        --searchResultBorder: #fff;
        --downloadButtonColor: #fff;
        --downloadButtonBg: #194880;
        --downloadButtonBorderColor: #c5d1df;
        --externalButtonColor: #fff;
        --externalButtonBg: #333;
        --externalButtonBorderColor: #999;
        --shareLinkColor: #fff;
        --shareIconBorder: #fff;
        --shareIconBg: #151515;
        --activityIndicatorLoadingDotColor: #fff;
        --activityIndicatorLoadingRingColor: #fff;
        --activeBorderWidth: 2px;
        --activeBookmark: #538bc5;
        --defaultBookmarkColor: #282828;
        --blueBookmarkColor: #428bca;
        --redBookmarkColor: #eb3223;
        --greenBookmarkColor: #75ef4c;
        --yellowBookmarkColor: #fffd54;
        --bookmarkThumbWidth: 37px;
        --bookmarkListSeparatorColor: #151515;
        --loadingPagePlaceholder: #fefdeb;
        --createButtonColor: #194880;
        --createButtonBorderColor: #c5d1df;
        --saveButtonColor: #194880;
        --saveButtonBorderColor: #c5d1df;
        --deleteButtonColor: #e51c26;
        --deleteButtonBorderColor: #f8c6c8;
      }
    </style>

    <div id="theatre-ia-wrap" class="container container-ia width-max ">
      <div id="theatre-ia" class="width-max">
        <div class="row">
          <div class="xs-col-12">
            <div id="IABookReaderMessageWrapper" style="display:none;"></div>
            <item-navigator
              item=${encJson}
              itemType="bookreader"
              basehost="archive.org"
            >
              <div
                id="IABookReaderWrapper"
                class="internal-beta"
                slot="bookreader"
              >
                <div id="BookReader" class="BookReader"></div>
              </div>
            </item-navigator>
          </div>
        </div>
      </div>
    </div>
  `;

// Render the template to the document
debugger;
render(bookReaderTemplate(), document.querySelector("#bookreader-container"));
