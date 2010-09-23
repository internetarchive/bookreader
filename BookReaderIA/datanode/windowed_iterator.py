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

from collections import deque
import itertools

class windowed_iterator:
    """ Wrap an iterator s.t. we can see [window] neighbors
    in either direction from the current item.

    Items are stored in a deque of size 2*window + 1, where the latest
    item is always in the middle position.

    The supplied clear_callback() is called for items more than
    [window] steps in the past.

    """

    # Todo? remove use of None as sentinel, to be able to represent
    # iterators returning None.

    def __init__(self, iterator, window, clear_callback=None):
        self.iterator = iterator
        # initialize deque with sentinel values
        self.items = deque((None for i in range(window + 1)),
                           window * 2 + 1)
        self.window = window
        self.clear_callback = clear_callback
    def __iter__(self):
        return self
    def __repr__(self):
        return str(self.items) + ' window: ' + str(self.window)
    def clear(self):
        for item in self.items:
            if item and self.clear_callback is not None:
                self.clear_callback(item)
        self.items.clear()
    def neighbor(self, delta):
        if abs(delta) > self.window:
            raise IndexError('Requested delta outside window')
        while self.window + delta + 1 > len(self.items):
            try:
                self.items.append(self.iterator.next())
            except StopIteration:
                return None
        return self.items[self.window + delta]
    def neighbors(self, window=None, modtwo=False):
        if window is None:
            window = self.window
        if window > self.window:
            raise IndexError('Requested delta outside window')
        for i in itertools.chain(range(-window, 0),
                                  range(1, window + 1)):
            if modtwo and i % 2 == 1:
                continue
            n = self.neighbor(i)
            if n is not None:
                yield n
    def next(self):
        nextitem = None
        if len(self.items) == self.window + 1:
            # elicit potential StopIteration before clearing/popping
            nextitem = self.iterator.next()
        if self.items[0] is not None and self.clear_callback is not None:
            self.clear_callback(self.items[0])
        self.items.popleft()
        if nextitem is not None:
            self.items.append(nextitem)
        return self.items[self.window]


if __name__ == '__main__':
    def sample_gen():
        for i in range(0, 10):
            yield { 'num': i*i }

    g = sample_gen()
    c = windowed_iterator(g, 3)

    for i, item in enumerate(c):
        print 'item %s: %s' % (i, item)
        # print c
        if i in (1, 4, 6, 9):
            print 'neighbors of item %s: %s' % (i, [n for n in c.neighbors(2)])
