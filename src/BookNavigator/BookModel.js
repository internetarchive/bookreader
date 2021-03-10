export class Book {
  constructor() {
    this.metadata = {};
    this.isRestricted = null;
  }

  setMetadata(itemMetadata) {
    this.metadata = itemMetadata;
  }

  setRestriction(isRestricted) {
    this.isRestricted = isRestricted;
  }
}
