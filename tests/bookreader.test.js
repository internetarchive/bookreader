var { br } = require('./bookreader');

test('', () => {
    expect(BookReader.util.clamp(2,1,3)).toEqual(2);
});
