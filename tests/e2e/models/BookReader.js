import { Selector } from 'testcafe';
import Nav from './Navigation';

/**
 * BookReader Model
 * @class
 * @classdesc defines BookReader base elements
 */
export default class BookReader {
  constructor () {
    this.shell = new Selector('.BookReader');
    this.BRcontainer = new Selector('.BRcontainer');
    this.nav = new Nav();
  }
}
