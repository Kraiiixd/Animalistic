const test = require('node:test')
const assert = require('node:assert/strict')
const { similarity, seasonInfo } = require('../lib/similarity')

test('judul sama persis = 1', () => {
    assert.equal(similarity('Dandadan', 'Dandadan'), 1)
})

test('"Season 2", "2nd Season" dan "S2" dianggap season yang sama', () => {
    assert.equal(similarity('Dandadan Season 2', 'Dandadan 2nd Season'), 1)
    assert.equal(similarity('Ao no Hako S2', 'Ao no Hako Season 2'), 1)
})

test('season berbeda tidak boleh cocok', () => {
    assert.equal(similarity('Dandadan', 'Dandadan 2nd Season'), 0)
    assert.equal(similarity('Re:Zero kara Hajimeru Isekai Seikatsu Season 3', 'Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season'), 0)
})

test('part berbeda tidak boleh cocok', () => {
    assert.equal(similarity('Re:Zero 2nd Season Part 2', 'Re:Zero 2nd Season'), 0)
})

test('tanda baca diabaikan', () => {
    assert.equal(similarity('Re: Zero', 'Re:Zero'), 1)
})

test('seasonInfo membaca nomor season', () => {
    assert.equal(seasonInfo('Kaguya-sama Season 3').season, 3)
    assert.equal(seasonInfo('Mushoku Tensei II').season, 2)
    assert.equal(seasonInfo('One Piece').season, 1)
})
