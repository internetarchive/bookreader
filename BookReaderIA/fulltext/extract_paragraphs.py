#!/usr/bin/python

from lxml.etree import iterparse, tostring, Element, parse
import sys, re, gzip, zipfile
from time import time

ns = '{http://www.abbyy.com/FineReader_xml/FineReader6-schema-v1.xml}'
page_tag = ns + 'page'

re_par_end_dot = re.compile(r'\.\W*$')

def read_text_line(line):
    text = ''
    for fmt in line:
        for c in fmt:
            text += c.text
    return text

def par_text(lines):
    cur = ''
    for line_num, line in enumerate(lines):
        first_char = line[0][0]
        if first_char.attrib.get('wordStart') == 'false' or first_char.attrib.get('wordFromDictionary') == 'false' and cur.endswith('- '):
            cur = cur[:-2]
        for fmt in line:
            cur += ''.join(c.text for c in fmt)
        if line_num + 1 != len(lines):
            cur += ' '
    return cur

def line_end_dot(line):
    return bool(re_par_end_dot.search(read_text_line(line)))

def par_unfinished(last_line, page_w):
    last_line_len = sum(len(fmt) for fmt in last_line)
    if last_line_len < 15 or line_end_dot(last_line):
        return False
    last_line_last_char = last_line[-1][-1]
    r = float(last_line_last_char.attrib['r'])
    return r / page_w > 0.75

def col_unfinished(last_line):
    return sum(len(fmt) for fmt in last_line) > 14 and not line_end_dot(last_line)

def par_iter(f):
    incomplete_par = None
    end_column_par = None
    skipped_par = []
    page_num = 0
    t0 = time()
    for eve, page in iterparse(f):
        if page.tag != page_tag:
            continue
        yield 'page'

        page_w = float(page.attrib['width'])
        assert page.tag == page_tag

        for block_num, block in enumerate(page):
            if block.attrib['blockType'] != 'Text':
                continue
            block.set('page', `page_num`)
            block.set('page_width', page.get('width'))
            block.set('page_height', page.get('height'))
            region, text = block
            for par_num, par in enumerate(text):
                if len(par) == 0 or len(par[0]) == 0 or len(par[0][0]) == 0:
                    continue
                last_line = par[-1]
                if end_column_par is not None:
                    if line_end_dot(last_line) and int(par[0].attrib['t']) < int(end_column_par[0].attrib['b']):
                        yield list(end_column_par) + list(par)
                        end_column_par = None
                        continue
                    else:
                        yield list(end_column_par)
                        end_column_par = None

                if incomplete_par is not None:
                    if line_end_dot(last_line):
                        yield list(incomplete_par) + list(par)
                        for p in skipped_par:
                            yield list(p)
                        incomplete_par = None
                        skipped_par = []
                    else:
                        skipped_par.append(par)
                elif par_num + 1 == len(text) and block_num + 1 == len(page) and par_unfinished(last_line, page_w):
                        incomplete_par = par
                elif par_num + 1 == len(text) and block_num + 1 != len(page) and col_unfinished(last_line):
                        end_column_par = par
                else:
                    yield list(par)

        page_num += 1
        page.clear()

def open_abbyy(filename):
    if filename.endswith('abbyy.gz'):
        return gzip.open(filename, 'rb')
    elif filename.endswith('abbyy.xml'):
        return open(filename)
    else:
        assert filename.endswith('abbyy.zip')
        z = zipfile.ZipFile(filename, 'r')
        names = z.namelist()
        assert len(names) == 1
        assert names[0].endswith('_abbyy.xml')
        return z.open(names[0])

lang_map = {
    'english': 'eng',
    'en': 'eng',
    'french': 'fre',
    'fr': 'fre',
    'german': 'deu',
    'de': 'deu',
    'ger': 'deu',
    'spanish': 'spa',
    'es': 'spa',
}

langs = set(['eng', 'fre', 'deu', 'spa'])

def read_meta(ia, path):
    root = parse(path + '/' + ia + '_meta.xml').getroot()
    title_elem = root.find('title')
    if title_elem is None or not title_elem.text:
        return
    ocr_elem = root.find('ocr')
    if ocr_elem is not None and ocr_elem.text == 'language not currently OCRable':
        print 'language not currently OCRable'
        sys.exit(0)
    lang_elem = root.find('language')
    if lang_elem is None:
        return
    l = lang_elem.text.lower()
    return l if l in langs else lang_map.get(l)

if __name__ == '__main__':
    page_count = 0
    ia = sys.argv[1]
    path = sys.argv[2]
    filename = path + '/' + sys.argv[3]
    lang = read_meta(ia, path)
    if not lang:
        lang = 'other'
    f = open_abbyy(filename)
    for lines in par_iter(f):
        if lines == 'page':
            page_count += 1
            continue
        text = par_text(lines)
        print text.encode('utf-8')
    print 'meta: %s %d' % (lang, page_count)
