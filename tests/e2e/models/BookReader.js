import { Selector } from 'testcafe';
import Nav from './Navigation.js';

/** Model defining BookReader base elements */
export default class BookReader {
  constructor () {
    this.shell = new Selector('.BookReader');
    this.BRcontainer = new Selector('.BRcontainer');
    this.nav = new Nav();
  }
}
