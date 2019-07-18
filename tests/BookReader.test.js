const { br } = require('../BookReader/BookReader.js');

test('clamp function returns Math.min(Math.max(value, min), max)', () => {
    expect(BookReader.util.clamp(2,1,3)).toEqual(2);
});

test('calculate a percentage suitable for CSS', () => {
    expect(BookReader.util.cssPercentage(2,1)).toEqual(200+'%');
});
