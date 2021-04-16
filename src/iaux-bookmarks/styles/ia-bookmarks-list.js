import { css } from 'lit-element';

export default css`
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
  margin: 5px 0 0 0;
  width: 98%;
  overflow-wrap: break-word;
}

ul {
  padding: 0;
  list-style: none;
}

li {
  cursor: pointer;
  outline: none;
  position: relative;
}
li .content {
  padding: 2px 0 4px 2px;
}
li button.edit {
  padding: 5px 2px 0 0;
  background: transparent;
  cursor: pointer;
  height: 40px;
  width: 40px;
  position: absolute;
  right: 2px;
  top: 2px;
  text-align: right;
}
li button.edit > * {
  display: block;
  height: 100%;
  width: 100%;
}

button {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  background: transparent;
  padding: 5px 10px;
  box-sizing: border-box;
  font: normal 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.add-bookmark:disabled {
  opacity: .5;
}

button.add-bookmark {
  height: 30px;
  margin-left: 5px;
}

ia-bookmark-edit {
  margin: 5px 5px 3px 6px;
}

ul > li:first-child .separator {
  display: none;
}
.separator {
  width: 98%;
  margin: 1px auto;
  height: 1px;
}
`;
