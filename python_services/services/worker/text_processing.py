import re

import nltk
import unidecode


def normalize(text: str, keep_asterisk=False):
    """
    Normalize a string, removing all non-alphanumeric or word characters
    """

    word_or_space = r'[^\w\s]'
    if keep_asterisk:
        word_or_space = r'[^\w\s*]'

    text = text.lower()
    text = re.sub(r'\d', '', text)
    text = unidecode.unidecode(text)
    text = re.sub(word_or_space, '', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def tokenize(text: str):
    """
    Tokenize a string, returning an array of words.
    """
    return nltk.word_tokenize(text)


# TODO: remove global state
lemmatizer = nltk.WordNetLemmatizer()


def lemmatize_word(word: str):
    return lemmatizer.lemmatize(word)


def lemmatize(tokens):
    return [lemmatize_word(word) for word in tokens]


def remove_stopwords(tokens):
    stopwords = set(nltk.corpus.stopwords.words('english'))
    return [token for token in tokens if token not in stopwords]


def preprocess(text: str, keep_asterisk=False, lemmatize_=True):
    text = normalize(text, keep_asterisk=keep_asterisk)
    tokens = tokenize(text)
    if lemmatize_:
        tokens = lemmatize(tokens)
    tokens = remove_stopwords(tokens)
    return tokens
