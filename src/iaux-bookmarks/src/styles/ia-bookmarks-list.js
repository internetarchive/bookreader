import { css } from 'lit-element';

export default css`
:host {
  display: block;
  overflow-y: auto;
  box-sizing: border-box;
  color: var(--primaryTextColor);
  background: var(--activeButtonBg);
  margin-bottom: 2rem;
}

small {
  font-style: italic;
}

h4 {
  margin: 0;
  font-size: 1.4rem;
}
h4 * {
  display: inline-block;
}
h4 icon-bookmark {
  vertical-align: bottom;
}
h4 span {
  vertical-align: top;
  padding-top: 1%;
}

p {
  padding: 0;
  margin: .5rem 0 0 0;
  width: 98%;
  overflow-wrap: break-word;
}

img {
  display: block;
  width: var(--bookmarkThumbWidth);
  min-height: calc(var(--bookmarkThumbWidth) * 1.55);
  background: var(--loadingPagePlaceholder);
}

ul {
  margin: var(--activeBorderWidth) 0.5rem 1rem 0;
  padding: 0;
  list-style: none;
}

li {
  cursor: pointer;
  outline: none;
  position: relative;
}
li .content {
  border: var(--activeBorderWidth) solid transparent;
  padding: .2rem 0 .4rem .2rem;
}
li .content.active {
  border: var(--activeBorderWidth) solid var(--activeBookmark);
}
li button.edit {
  padding: .5rem .2rem 0 0;
  background: transparent;
  cursor: pointer;
  height: 4rem;
  width: 4rem;
  position: absolute;
  right: 0.2rem;
  top: 0.2rem;
  text-align: right;
}
li button.edit > * {
  width: var(--iconWidth, 20px);
  height: var(--iconHeight, 20px);
  display: block;
  height: 100%;
  width: 100%;
}

icon-bookmark {
  width: var(--bookmarkIconWidth, 16px);
  height: var(--bookmarkIconHeight, 24px);
}
icon-bookmark.blue {
  --iconFillColor: var(--blueBookmarkColor, #0023f5);
}
icon-bookmark.red {
  --iconFillColor: var(--redBookmarkColor, #eb3223);
}
icon-bookmark.green {
  --iconFillColor: var(--greenBookmarkColor, #75ef4c);
}

button {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  background: transparent;
  padding: .5rem 1rem;
  box-sizing: border-box;
  font: normal 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.add-bookmark:disabled {
  opacity: .5;
}

button.add-bookmark {
  background: var(--createButtonColor);
  height: 3rem;
  border: 1px solid var(--createButtonBorderColor);
  margin-left: 0.5rem;
}

ia-bookmark-edit {
  --saveButtonColor: #538bc5;
  --deleteButtonColor: #d33630;
  margin: .5rem .5rem .3rem .6rem;
}

ul > li:first-child .separator {
  display: none;
}
.separator {
  width: 98%;
  margin: .1rem auto;
  background-color: var(--bookmarkListSeparatorColor);
  height: 0.1rem;
}
`;
