#!/usr/bin/python

# Copyright(c)2008-2010 Internet Archive. Software license AGPL version 3.
# 
# This file is part of BookReader.
# 
#     BookReader is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
# 
#     BookReader is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
# 
#     You should have received a copy of the GNU Affero General Public License
#     along with BookReader.  If not, see <http://www.gnu.org/licenses/>.
#     
#     The BookReader source is hosted at http://github.com/openlibrary/bookreader/


#watch out for blank lines (<LINE></LINE>)

from lxml import etree
import sys
import re
import json
import re

from windowed_iterator import windowed_iterator
from diff_match_patch import diff_match_patch

minWordsInBlock = 25
maxWordsInBlock = 50

# Header/Footer detection parameters

# 'Window' of neighboring pages to check for similar text that may
# mark headers / footers
windowsize = 10

# Weights to assign to potential headers / footers.
# len(weights) should be even.
weights = (1.0, .75,
           .75, 1.0)
# weights = (1.0, .75, .5,
#            .5, .75, 1.0)

# allow potential headers/footers with this length difference
max_length_difference = 4

dmp = diff_match_patch()
dmp.Match_Distance = 2 # number of prepended characters allowed before match
dmp.Match_Threshold = .5 # 0 to 1 ... higher => more fanciful matches,
                         # slower execution.

# minimum match score for a line to be considered a header or footer.
min_score = .9


def guess_hfs(page, pages):
    """ Given a page and a 'windowed iterator' giving access to neighboring
    pages, return a dict containing likely header/footer lines on that page.

    A line is considered a likely header/footer if it's near the
    start/end of the page, and if it is textually similar the same
    line on neighboring pages.
    """
    
    result = {}
    
    hf_candidates = get_hf_candidates(page)
    neighbor_info = {}
    for i in range(len(weights)):
        if hf_candidates[i] is None:
            continue
        score = 0
        for neighbor_page in pages.neighbors():
            if neighbor_page in neighbor_info:
                neighbor_candidates = neighbor_info[neighbor_page]
            else:
                neighbor_candidates = get_hf_candidates(neighbor_page)
                neighbor_info[neighbor_page] = neighbor_candidates
            if neighbor_candidates[i] is None:
                continue
            text = hf_candidates[i][1]
            neighbor_text = neighbor_candidates[i][1]
            if abs(len(text) - len(neighbor_text)) > max_length_difference:
                continue
            
            matchstart = dmp.match_main(hf_candidates[i][1],
                                        neighbor_candidates[i][1], 0)
            if matchstart != -1:
                score += weights[i]
            if score > min_score:
                result[hf_candidates[i][0]] = True
                break
    return result

        
def simplify_line_text(line):
    text = etree.tostring(line, method='text', encoding=unicode).lower();
    # collape numbers (roman too) to '@' so headers will be more
    # similar from page to page
    text = re.sub(r'[ivx\d]', r'@', text)
    text = re.sub(r'\s+', r' ', text)
    return text


def get_hf_candidates(page):
    result = []
    hfwin = len(weights) / 2
    lines = [line for line in page.findall('.//LINE')]
    for i in range(hfwin) + range(-hfwin, 0):
        if abs(i) < len(lines):
            result.append((lines[i], simplify_line_text(lines[i])))
        else:
            result.append(None)
    return result


def main(args):
    path = args[0]
    pageNum = int(args[1])
    callback = args[2]

    if not re.match('^/\d{1,2}/items/.+_djvu.xml$', path):
        sys.exit(-1);
    
    if ('ttsNextPageCB' != callback):
        callback = 'ttsStartCB'

    f = open(path)
    context = etree.iterparse(f, tag='OBJECT')
    def drop_event(iter):
        for event, page in iter:
            yield page
    pages = drop_event(context)
    def clear_page(page):
        page.clear()
    pages = windowed_iterator(pages, windowsize, clear_page)
    for i, page in enumerate(pages):
        if i == pageNum:
            break
    hfs = guess_hfs(page, pages)

    lines = page.findall('.//LINE')
    
    #print 'got %s .//lines' % len(lines)

    textBlocks = []
    block = ''
    rects = []

    numWords = 0

    for line in lines:
        # skip headers/footers
        if line in hfs:
            continue

        top = sys.maxint
        left = sys.maxint
        right = -1
        bottom = -1

        numWordsInLine = 0

        words = line.findall('.//WORD')

        #print 'at start of line, rects ='
        #print rects

        for word in words:

            numWordsInLine += 1

            text = word.text
            #print 'got text ' + text

            coords = word.get('coords').split(',') #l,b,r,t
            coords = map(int, coords)

            if int(coords[0]) < left:
                left = coords[0]

            if coords[1] > bottom:
                bottom = coords[1]

            if coords[2] > right:
                right = coords[2]

            if coords[3] < top:
                top = coords[3] 

            block += word.text + ' '
            numWords += 1

            if text.endswith('.') and (numWords>minWordsInBlock):
                #print 'end of block with numWords=%d' % numWords
                #print 'block = ' + block

                rects.append([left, bottom, right, top])            

                #textBlocks.append(block.strip())
                rects.insert(0, block.strip())            
                textBlocks.append(rects)
                block = ''
                rects = []
                numWords = 0
                numWordsInLine = 0
                top = sys.maxint
                left = sys.maxint
                right = -1
                bottom = -1

        #end of line
        if numWordsInLine > 0:
            rects.append([left, bottom, right, top])

        if numWords>maxWordsInBlock:
            #textBlocks.append(block.strip())        
            rects.insert(0, block.strip())            
            textBlocks.append(rects)        
            block = ''
            numWords = 0
            rects = []        

        #print 'at end of line, rects ='
        #print rects

    if '' != block:
        #textBlocks.append(block.strip())
        rects.insert(0, block.strip())            
        textBlocks.append(rects)

    print 'br.%s(%s);' % (callback, json.dumps(textBlocks))


if __name__ == '__main__':
    main(sys.argv[1:])
