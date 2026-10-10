// Stub for .svg imports in tests; see jest.moduleNameMapper in package.json.
// The elements item-navigator imports its glyphs for their URL — webpack inlines
// them as data URIs. Tests only need the import to resolve, not the artwork.
module.exports = 'data:image/svg+xml,';
