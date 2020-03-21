import { Selector } from 'testcafe';
import Nav from './Navigation';


class BookReader {
  constructor () {
    this.shell = new Selector('.BookReader');
    this.BRcontainer = new Selector('.BRcontainer');
    this.Nav = Nav;
  }
}

export default new BookReader();