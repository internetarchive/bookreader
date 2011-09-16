#!/usr/bin/python
# written by Edward Betts <edward@archive.org> in October 2010

from lxml.etree import iterparse, tostring, Element
from itertools import izip
from urllib import urlopen
import sys, re, json, os, urllib
from extract_paragraphs import par_iter, open_abbyy
from subprocess import Popen, PIPE

ns = '{http://www.abbyy.com/FineReader_xml/FineReader6-schema-v1.xml}'
page_tag = ns + 'page'

solr_inside = 'http://ol-search-inside:8983/solr/inside/select?rows=1&wt=json&fl=ia,body_length,page_count&hl=true&hl.fl=body&hl.fragsize=0&hl.maxAnalyzedChars=-1&hl.usePhraseHighlighter=true&hl.simple.pre={{{&hl.simple.post=}}}&q.op=AND&q='

class Space():
    text = ' '

space = Space()

def par_char(lines):
    cur = []
    match_start = False
    matches = []
    for line_num, line in enumerate(lines):
        first_char = line[0][0]
        if first_char.attrib.get('wordStart') == 'false' or first_char.attrib.get('wordFromDictionary') == 'false' and len(cur) > 1 and cur[-2].text == '-':
            cur = cur[:-2]
        for fmt in line:
            cur += [c for c in fmt]
        if line_num + 1 != len(lines):
            cur += [space]
    return cur

def skip_page(abbyy_iter):
    for par in abbyy_iter:
        if par != 'page':
            yield par

re_braces = re.compile(r'(\{\{\{|\}\}\})')
def find_matches(hl_body, abbyy_iter, leaf0_missing=False):
    text_offset = 0
    match_number = 0
    leaf_offset = 1 if leaf0_missing else 0
    for solr_line, par in izip(hl_body.split('\n'), skip_page(abbyy_iter)):
        if '{{{' not in solr_line:
            text_offset += len(solr_line)
            continue
        match_with = solr_line
        abbyy_text = ''.join(c.text for c in par_char(par))
        cur = {
            'text': solr_line,
            #'abbyy': ''.join(c.text for c in par_char(par)),
            'par': []
        }
        if re_braces.sub('', cur['text']) != abbyy_text:
            cur['error'] = 'mismatch'
            match_number += 1
            yield match_number, cur
            continue
        prev_char = None
        match_line = None
        match_par = None
        for c in par_char(par):
            text_offset += 1
            if match_with.startswith('{{{'):
                match_with = match_with[3:]
                match_line = c.getparent().getparent()
                if not cur['par'] or match_line.getparent() != match_par:
                    match_par = match_line.getparent()
                    block = match_par.getparent().getparent()
                    cur['par'].append({
                        't': int(match_par[0].get('t')),
                        'b': int(match_par[-1].get('b')),
                        'l': int(block.get('l')),
                        'r': int(block.get('r')),
                        'boxes': [],
                        'page': int(block.get('page')) + leaf_offset,
                        'page_width': int(block.get('page_width')),
                        'page_height': int(block.get('page_height')),
                    })
                line = c.getparent().getparent()
                cur['par'][-1]['boxes'].append({
                    't': int(line.get('t')),
                    'b': int(line.get('b')),
                    'l': int(c.get('l')),
                    'page': int(block.get('page')) + leaf_offset,
                })
            elif match_with.startswith('}}}'):
                cur['par'][-1]['boxes'][-1]['r'] = int(prev_char.get('r'))
                match_with = match_with[3:]
                match_line = None
            elif match_line is not None and c.getparent().getparent() != match_line:
                #print 'line break in match'
                end_line_char = match_line[-1][-1]
                cur['par'][-1]['boxes'][-1]['r'] = int(end_line_char.get('r'))
                match_line = c.getparent().getparent()
                if match_line.getparent() != match_par:
                    match_par = match_line.getparent()
                    cur['par'].append({
                        't': int(match_par.get('t')),
                        'b': int(match_par.get('b')),
                        'l': int(match_par.get('l')),
                        'r': int(match_par.get('r')),
                        'boxes': [],
                        'page': int(block.get('page')) + leaf_offset,
                    })

                cur['par'][-1]['boxes'].append({
                    't': int(match_line.get('t')),
                    'b': int(match_line.get('b')),
                    'l': int(c.get('l')),
                })

            if len(match_with) == 0:
                break
            assert c.text == match_with[0]
            match_with = match_with[1:]
            prev_char = c
        if match_with == '}}}':
            cur['par'][-1]['boxes'][-1]['r'] = int(prev_char.get('r'))
        match_number += 1
        yield match_number, cur

if __name__ == '__main__':
    (item_id, doc, path, q) = sys.argv[1:5]
    callback = sys.argv[5] if len(sys.argv) > 5 else None
    q = q.strip()
    if not q:
        if callback:
            print callback + '(',
        print json.dumps({ 'ia': item_id, 'q': q, 'matches': [], 'error': 'You must enter a query.' }, indent=2),
        print ')' if callback else ''
        sys.exit(0)
    reply = urllib.urlopen(solr_inside + urllib.quote('ia:' + item_id)).read()
    results = json.loads(reply)
    assert os.path.exists(path)
    re_item = re.compile('^/\d+/items/([^/]+)')
    filename = None
    for ending in 'abbyy.gz', 'abbyy.xml', 'abbyy.zip':
        test_filename = os.path.join(path, doc + '_' + ending)
        if os.path.exists(test_filename):
            filename = test_filename
            break
    if callback:
        print callback + '(',
    if not results['response']['docs']:
        index_result = urlopen('http://edward.openlibrary.org/index_now/' + item_id).read()
        if not index_result.startswith('done'):
            print json.dumps({ 'ia': item_id, 'q': q, 'matches': [], 'indexed': False}, indent=2),
            print ')' if callback else ''
            sys.exit(0)
    if not filename:
        print """{
    "ia": %s,
    "q": %s,
    "matches": [],
}""" % (json.dumps(item_id), json.dumps(q)),

        print ')' if callback else ''
        sys.exit(0)
    solr_q = 'ia:%s AND %s' % (item_id, q)
    reply = urllib.urlopen(solr_inside + urllib.quote(solr_q)).read()
    try:
        results = json.loads(reply)
    except:
        print reply
        raise
    if not results['response']['docs']:
        print """{
    "ia": %s,
    "q": %s,
    "indexed": true,
    "matches": [],
}""" % (json.dumps(item_id), json.dumps(q)),

        print ')' if callback else ''
        sys.exit(0)
    solr_doc = results['response']['docs'][0]
    hl_body = results['highlighting'][item_id]['body'][0]
    jp2_zip = os.path.join(path, doc + '_jp2.zip')
    tif_zip = os.path.join(path, doc + '_tif.zip')
    leaf0_missing = False
    if os.path.exists(jp2_zip):
        leaf0_missing = '0000.jp2' not in Popen(['unzip', '-l', jp2_zip], stdout=PIPE).communicate()[0]
    elif os.path.exists(tif_zip):
        leaf0_missing = '0000.tif' not in Popen(['unzip', '-l', tif_zip], stdout=PIPE).communicate()[0]

    f = open_abbyy(filename)
    abbyy_iter = par_iter(f)

    print """{
    "ia": %s,
    "q": %s,
    "indexed": true,
    "page_count": %d,
    "body_length": %d,
    "leaf0_missing": %s,
    "matches": [ """ % (json.dumps(item_id), json.dumps(q), solr_doc['page_count'], solr_doc['body_length'], 'true' if leaf0_missing else 'false')
    prev = ''
    error = None
    for num, match in find_matches(hl_body, abbyy_iter, leaf0_missing):
        if 'error' in match:
            error = match['error']
            break
        if prev:
            print prev + ','
        prev = json.dumps(match, indent=4)
    if error:
        print prev, '],\n    "error": %s' % (json.dumps(error)),
    else:
        print prev, ']',
    print '\n}' + (')' if callback else '')
