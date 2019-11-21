export default class PageChunk {
    /**
     * @param {number} leafIndex 
     * @param {number} chunkIndex 
     * @param {string} text 
     * @param {DJVURect[]} lineRects 
     */
    constructor(leafIndex, chunkIndex, text, lineRects) {
        this.leafIndex = leafIndex;
        this.chunkIndex = chunkIndex;
        this.text = text;
        this.lineRects = lineRects;
    }

    /**
     * @param {string} server 
     * @param {string} bookPath 
     * @param {number} leafIndex 
     * @return {Promise<PageChunk[]>}
     */
    static fetch(server, bookPath, leafIndex) {
        // jquery's ajax "PromiseLike" implementation is inconsistent with
        // modern Promises, so convert it to a full promise (it doesn't forward
        // a returned promise to the next handler in the chain, which kind of 
        // defeats the entire point of using promises to avoid "callback hell")
        return new Promise((res, rej) => {
            $.ajax({
                type: 'GET',
                url: `https://${server}/BookReader/BookReaderGetTextWrapper.php`,
                dataType:'jsonp',
                cache: true,
                data: {
                    path: `${bookPath}_djvu.xml`,
                    page: leafIndex
                },
                error: rej,
            })
            .then(chunks => {
                res(PageChunk._fromTextWrapperResponse(leafIndex, chunks));
            });
        });
    }

    /**
     * @param {number} leafIndex
     * @param {Array<[String, ...DJVURect[]]>} chunksResponse 
     * @return {PageChunk[]}
     */
    static _fromTextWrapperResponse(leafIndex, chunksResponse) {
        return chunksResponse.map((c, i) => {
            const correctedLineRects = PageChunk._fixChunkRects(c.slice(1));
            return new PageChunk(leafIndex, i, c[0], correctedLineRects);
        });
    }

    /**
     * @private
     * Sometimes the first rectangle will be ridiculously wide/tall. Find those and fix them
     * *NOTE*: Modifies the original array and returns it.
     * *NOTE*: This should probably be fixed on the petabox side, and then removed here
     * Has 2 problems:
     *  - If the rect is the last rect on the page (and hence the only rect in the array),
     *    the rect's size isn't fixed
     * - Because this relies on the second rect, there's a chance it won't be the right
     *   width
     * @param {DJVURect[]} rects 
     * @return {DJVURect[]}
     */
    static _fixChunkRects(rects) {
        if (rects.length < 2) return rects;

        const firstRect = rects[0];
        const secondRect = rects[1];
        const { 0: left, 1: bottom, 2: right, 3: top } = firstRect;
        const width = right - left;
        const secondHeight = secondRect[1] - secondRect[3];
        const secondWidth = secondRect[2] - secondRect[0];
        const secondRight = secondRect[2];

        if (width > secondWidth * 30) {
            // Set the end to be the same
            firstRect[2] = secondRight;
            // And the top to be the same height
            firstRect[3] = bottom - secondHeight;
        }

        return rects;
    }
}

/**
 * @typedef {[number, number, number, number]} DJVURect
 * coords are in l,b,r,t order
 */
