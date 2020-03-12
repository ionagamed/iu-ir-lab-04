import collections
from dataclasses import dataclass, field
from typing import Dict
import jellyfish


class SoundexIndex:
    """
    Index which can provided closest-neighbours for a word with the same soundex
    encoding.
    """
    def __init__(self, closest_neighbours=3):
        self.closest_neighbours = closest_neighbours
        self.phonetic_map = collections.defaultdict(set)

    def add(self, words):
        for word in words:
            phonetic = jellyfish.soundex(word)
            self.phonetic_map[phonetic].add(word)

    def get_most_similar(self, word):
        def similar_key(x):
            return jellyfish.levenshtein_distance(x, word)

        phonetic = jellyfish.soundex(word)
        similar = self.phonetic_map[phonetic]
        most_similar = sorted(list(similar), key=similar_key)

        return most_similar[:self.closest_neighbours]


class PrefixTreeIndex:
    """
    Basically a big dict with all words.
    """
    @dataclass
    class Node:
        children: Dict[str, "Node"] = field(default_factory=dict)
        endpoint: bool = False

    def __init__(self):
        self.root = self.Node()

    def add(self, words):
        for word in words:
            node = self.root
            for char in word:
                if char not in node.children:
                    node.children[char] = self.Node()
                node = node.children[char]
            node.endpoint = True

    def lookup(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return None
            node = node.children[char]
        return node


class RotatedPrefixTreeIndex(PrefixTreeIndex):
    """
    Basically a bid dict with all words, but all words end with $, and there are rotated
    variations (to support a*b queries).
    """
    def add(self, words):
        rotated_words = []
        for word in words:
            word = word + '$'
            for _ in range(len(word)):
                rotated_words.append(word)
                word = word[1:] + word[0]
        super().add(rotated_words)
