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
import json

minWordsInBlock = 50
maxWordsInBlock = 100

path = sys.argv[1]
pageNum = int(sys.argv[2])

tree = etree.parse(path)

objects = tree.findall('//OBJECT')

#print 'got %s objects' % len(objects)

page = objects[pageNum]

lines = page.findall('.//LINE')

#print 'got %s .//lines' % len(lines)

textBlocks = []
block = ''
rects = []

numWords = 0

for line in lines:

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

print json.dumps(textBlocks)