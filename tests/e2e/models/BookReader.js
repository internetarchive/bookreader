import { Selector } from 'testcafe';
import Nav from './Navigation.js';

/** Model defining BookReader base elements */
export default class BookReader {
  shell = Selector('.BookReader');
  BRcontainer = Selector('.BRcontainer');
  nav = new Nav();
}
