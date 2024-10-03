import { marshallSearchResults } from "@/src/plugins/search/utils";

export const DUMMY_RESULTS = {
  ia: "adventuresofoli00dick",
  q: "child",
  indexed: true,
  page_count: 644,
  body_length: 666,
  leaf0_missing: false,
  matches: [{
    text: 'For a long; time after it was ushered into this world of sorrow and trouble, by the parish surgeon, it remained a matter of considerable doubt wliether the {{{child}}} Avould survi^ e to bear any name at all; in which case it is somewhat more than probable that these memoirs would never have appeared; or, if they had, that being comprised within a couple of pages, they would have possessed the inestimable meiit of being the most concise and faithful specimen of biography, extant in the literature of any age or country.',
    par: [{
      boxes: [{r: 1221, b: 2121, t: 2075, page: 37, l: 1107}],
      b: 2535,
      t: 1942,
      page_width: 1790,
      r: 1598,
      l: 50,
      page_height: 2940,
      page: 37,
    }],
  }],
};

marshallSearchResults(DUMMY_RESULTS, () => '', '{{{', '}}}');
