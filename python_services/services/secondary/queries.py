from dataclasses import dataclass

from ..worker.text_processing import lemmatize_word, preprocess
from .indexes import RotatedPrefixTreeIndex, PrefixTreeIndex, SoundexIndex


__all__ = ['parse_query', 'SpellingIndexes']


def node_of(type_, args):
    return {
        'type': type_,
        'args': args
    }


@dataclass
class SpellingIndexes:
    rotated: RotatedPrefixTreeIndex
    prefix: PrefixTreeIndex
    soundex: SoundexIndex


def parse_wildcard_query(word: str, indexes: SpellingIndexes):
    i = word.index('*')
    if not i:
        return set()

    word = word[i + 1:] + '$' + word[:i]
    print(word)
    word_node = indexes.rotated.lookup(word)
    if not word_node:
        return set()

    def children_of(node):
        if node.endpoint:
            yield ''
        for key, child in node.children.items():
            for value in children_of(child):
                yield key + value

    lemmatized = set()
    for found_word in children_of(word_node):
        if found_word:
            found_word = word + found_word
            i = found_word.index('$')
            found_word = found_word[i + 1:] + found_word[:i]
            lemmatized.add(lemmatize_word(found_word))

    return node_of('or', [node_of('word', word) for word in lemmatized])


def parse_word_similar_query(word: str, indexes: SpellingIndexes):
    similar = indexes.soundex.get_most_similar(word)
    return node_of('or', [node_of('word', word) for word in similar])


def parse_word_query(word: str, indexes: SpellingIndexes):
    if '*' in word:
        return parse_wildcard_query(word, indexes)
    if not indexes.prefix.lookup(word):
        return parse_word_similar_query(word, indexes)
    else:
        return node_of('word', word)


def parse_query(query: str, indexes: SpellingIndexes):
    words = preprocess(query, keep_asterisk=True)
    return node_of('and', [parse_word_query(word, indexes) for word in words])
