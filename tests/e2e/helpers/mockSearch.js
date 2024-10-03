export const TEST_TEXT_FOUND = 'theory';
export const TEST_TEXT_NOT_FOUND = 'HopefullyNotFoundLongWord';
export const PAGE_FIRST_RESULT = 30;

export const SEARCH_INSIDE_URL_RE  = /https:\/\/ia[0-9]+\.us\.archive\.org\/fulltext\/inside\.php\?item_id=.*/;

//adding jQueryxxxxxxxx-xxxxxxxx (semi-random numbers) from request url to returned search request object
/** Mock response for a matching search term. */
export function mockResponseFound(req, res) {
  const requestUrl = new URL(req.url);
  const jqueryUrl = requestUrl.searchParams.get("callback");
  const wholeString = jqueryUrl + '(' + JSON.stringify(MOCKED_RESPONSE_FOUND) + ')';
  res.setBody(wholeString);
}

/** Mock response for a matching search term. */
export function mockResponseNotFound(req, res) {
  const requestUrl = new URL(req.url);
  const jqueryUrl = requestUrl.searchParams.get("callback");
  const wholeString = jqueryUrl + '(' + JSON.stringify(MOCKED_RESPONSE_NOT_FOUND) + ')';
  res.setBody(wholeString);
}

const PAGE_FIRST_RESULT_ADJUSTED = PAGE_FIRST_RESULT + 12;
//mocked objects inside an unsuccessful search and of a random successful search returned by search requests
const MOCKED_RESPONSE_NOT_FOUND = {
  "ia": "theworksofplato01platiala",
  "q": TEST_TEXT_NOT_FOUND,
  "indexed": true,
  "page_count": 1,
  "body_length": 666,
  "leaf0_missing": true,
  "matches": [],
};

const MOCKED_RESPONSE_FOUND = {
  "ia": "This request has been mocked",
  "q": TEST_TEXT_FOUND,
  "indexed": true,
  "page_count": 644,
  "body_length": 666,
  "leaf0_missing": false,
  "matches": [
    {
      "text": "Everybody knows the story of another experimental philosopher who had a great {{{" + TEST_TEXT_FOUND + "}}} about a horse being able to live without eating, and who demonstrated it so well, that he got his own horse down to a straw a day, and would unquestionably have rendered him a very spirited and rampacious animal on nothing at all, if he had not died, four-and-twenty hours before he was to have had his first comfortable bait of air. Unfortunately for the experimental philosophy of the female to whose protecting care Oliver Twist was delivered over, a similar result usually attended the operation of her system; for at the very moment when a child had contrived to exist upon the smallest possible portion of the weakest possible food, it did perversely happen in eight and a half cases out of ten, either that it sickened from want and cold, or fell into the fire from neglect, or got half-smothered by accident; in any one of which cases, the miserable little being was usually summoned into another world, and there gathered to the fathers it had never known in this.",
      "par": [
        {
          "boxes": [
            {
              "r": 1045,
              "b": 811,
              "t": 753,
              "page": PAGE_FIRST_RESULT_ADJUSTED,
              "l": 894,
            },
          ],
          "b": 1935,
          "t": 686,
          "page_width": 1790,
          "r": 1704,
          "l": 148,
          "page_height": 2940,
          "page": PAGE_FIRST_RESULT_ADJUSTED,
        },
      ],
    },
    {
      "text": "That when the Dodger, and his accomplished friend Master Bates, joined in the hue-and-cry which was raised at Oliver's heels, in consequence of their executing an illegal conveyance of Mr. Brownlow's personal property, as has been already described, they were actuated by a very laudable and becoming regard for themselves ; and forasmuch as the freedom of the subject and the liberty of the individual are among the first and proudest boasts of a true-hearted Englishman, so, I need hardly beg the reader to observe, that this action should tend to exalt them in the opinion of all jniblic and patriotic men, in almost as great a degree as this strong proof of their anxiety for their own preservation and safety goes to corroborate and confirm the little code of laws which certain profound and sound-judging philosophers have laid down as the mainsprings of all Nature's deeds and actions : the said philosophers very wisely reducing the good lady's proceedings to matters of maxim and {{{" + TEST_TEXT_FOUND + "}}} : and, by a very neat and pretty compliment   to   her   exalted   wisdom   and   understanding,   putting entirely out of sight any considerations of heart, or generous impulse and feeling. For, these are matters totally beneath a female who is acknowledged by universal admission to be far above the numerous little foibles and weaknesses of her sex.",
      "par": [
        {
          "boxes": [
            {
              "r": 593,
              "b": 2567,
              "t": 2507,
              "page": 162,
              "l": 441,
            },
          ],
          "b": 2631,
          "t": 1439,
          "page_width": 1790,
          "r": 1620,
          "l": 56,
          "page_height": 2940,
          "page": 162,
        },
      ],
    },
  ],
};

export const SEARCH_MATCHES_LENGTH = MOCKED_RESPONSE_FOUND.matches.length;
