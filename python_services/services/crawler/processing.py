import os
from urllib.parse import urlparse, quote_plus
from bs4 import BeautifulSoup
from bs4.element import Comment
import requests


# https://stackoverflow.com/questions/1936466/beautifulsoup-grab-visible-webpage-text
def text_from_html(soup):
    def tag_visible(element):
        wrong_elements = ['style', 'script', 'head', 'title', 'meta', '[document]']
        if element.parent.name in wrong_elements:
            return False
        if isinstance(element, Comment):
            return False
        return True

    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)
    return " ".join(t.strip() for t in visible_texts)


def links_from_html(url: str, soup):
    parsed_url = urlparse(url)
    base_url = f'{parsed_url.scheme}://{parsed_url.netloc}'

    def is_link_allowed(l):
        return not l.startswith('javascript:') and not l.startswith('tel:')

    def normalize_link(l):
        if not l.startswith('http://') and not l.startswith('https://'):
            return f'{base_url}{l}'
        return l

    links = []
    for tag in soup.find_all('a'):
        try:
            if tag['href'] and is_link_allowed(tag['href']):
                links.append(normalize_link(tag['href']))
        except Exception:
            pass

    return links


def parse_doc(url: str, text: str):
    soup = BeautifulSoup(text)
    parsed_text = text_from_html(soup)
    links = links_from_html(url, soup)

    storage_response = requests.get(
        os.environ.get('STORAGE_ADDRESS') + '/' + quote_plus(url)
    )
    if storage_response.status_code == 200:
        if storage_response.json()['contents'] == text:
            print(f'Skipping {url} - already in index')
            return links

    requests.post(
        os.environ.get('MASTER_ADDRESS') + '/processDoc',
        json={
            'text': parsed_text,
            'docId': url
        }
    )
    requests.post(
        os.environ.get('STORAGE_ADDRESS') + '/' + quote_plus(url),
        json={
            'contents': text
        }
    )

    return links


def crawl_url(url: str, depth=1):
    try:
        text = requests.get(url, timeout=5).text
        urls = parse_doc(url, text)

        urls = [x for x in urls if 'html/' in x][:10]

        if depth > 0:
            for url in urls:
                yield from crawl_url(url, depth=depth - 1)
    except Exception as e:
        print(repr(e))


def crawl():
    start_url = 'https://tools.ietf.org/rfc/index'
    list(crawl_url(start_url))
