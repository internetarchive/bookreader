# Deep Read plugin

Underlines named entities (people, places, organizations, works…) in the text
layer. Clicking one opens the **Deep Read** side panel with details about it.

```js
// Enabled by default. Without pageEntitiesUrl it uses MockDeepReadApi, which
// guesses entities from the page's OCR so the UI works on any book.
br.options.plugins.deepRead = {
  pageEntitiesUrl: 'https://example.archive.org/deep-read/v0/{{bookId}}/pages/{{pageIndex}}/entities',
  entityUrl: 'https://example.archive.org/deep-read/v0/{{bookId}}/entities/{{entityId|urlencode}}',
};
```

Requires the `textSelection` plugin (mentions are rendered into its text layer).

## Flow

1. When a page's text layer renders, `GET pageEntitiesUrl` for that page.
2. Each mention's text fragment is located and wrapped in a
   `<mark class="BRhighlight BRdeepReadEntity BRdeepReadEntity--{type}">`.
3. On click, `GET entityUrl` and render the result in the side panel.
   Mentions listed there jump to their page.

## API

Types are defined as JSDoc in [`DeepReadApi.js`](./DeepReadApi.js).

### Text fragments

Mentions are located with BookReader text fragments: the same format as the
`?text=` url param (see `BookReaderTextFragment`):

```
pageNumber:prefix-,quote,-suffix
```

- `pageNumber` is the asserted page number, or `n{pageIndex}`.
- `prefix`/`suffix` are optional; a few words of context to disambiguate the
  quote when it appears more than once on the page.
- Not URI-encoded (it's a JSON string), but `,` and `:` in the text must be
  replaced with spaces (`replaceTextFragmentDelimiters`), as
  `BookReaderTextFragment.toNormalizedString()` does.
- Long quotes may be `quoteStart,quoteEnd`.

Matching is case-insensitive and whitespace-tolerant against the OCR text.

### `GET pageEntitiesUrl` — entities on a page

`{{pageIndex}}` is zero-based.

```json
{
  "identifier": "goody",
  "pageIndex": 12,
  "mentions": [
    { "entityId": "Q90", "fragment": "n12:the city of-,Paris,-was founded in" },
    { "entityId": "Q517", "fragment": "n12:Emperor-,Napoleon,-crossed the" },
    { "entityId": "Q90", "fragment": "n12:returned to-,Paris,-in the spring" }
  ],
  "entities": {
    "Q90": { "id": "Q90", "label": "Paris", "type": "place" },
    "Q517": { "id": "Q517", "label": "Napoleon", "type": "person" }
  }
}
```

`type` is one of `person`, `place`, `organization`, `work`, `event`, `concept`.

### `GET entityUrl` — entity details

```json
{
  "id": "Q90",
  "label": "Paris",
  "type": "place",
  "description": "Capital and largest city of France.",
  "image": { "url": "https://upload.wikimedia.org/…/Paris.jpg", "alt": "Paris skyline", "credit": "Wikimedia Commons" },
  "facts": [
    { "label": "Country", "value": "France" },
    { "label": "Coordinates", "value": "48.8567° N, 2.3508° E" }
  ],
  "links": [
    { "label": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Paris" },
    { "label": "Wikidata", "url": "https://www.wikidata.org/wiki/Q90" }
  ],
  "mentions": [
    "n12:the city of-,Paris,-was founded in",
    "n48:the road to-,Paris,-was"
  ],
  "related": [
    { "id": "Q142", "label": "France", "type": "place" }
  ]
}
```

Everything but `id`, `label` and `type` is optional. `mentions` are other
places this entity appears in *this* book; `related` entities are clickable in
the panel and open their own details.

## Open questions

- Batch endpoint for several pages at once (e.g. `?pages=12,13`) to cut
  requests in 2up/scroll mode.
- Entity ids: Wikidata QIDs where linkable, book-local ids otherwise?
- Auth/protected books: should the API receive the OCR, or fetch it itself?
