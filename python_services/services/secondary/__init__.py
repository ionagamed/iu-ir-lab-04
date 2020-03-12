from aiohttp import web
from .indexes import PrefixTreeIndex, RotatedPrefixTreeIndex, SoundexIndex
from .queries import SpellingIndexes, parse_query


indexes = SpellingIndexes(
    rotated=RotatedPrefixTreeIndex(),
    prefix=PrefixTreeIndex(),
    soundex=SoundexIndex()
)


async def handle_store_tokens(request: web.Request):
    body = await request.json()
    tokens = body['tokens']
    indexes.rotated.add(tokens)
    indexes.prefix.add(tokens)
    indexes.soundex.add(tokens)
    return web.json_response({'status': 'ok'})


async def handle_parse_query(request: web.Request):
    body = await request.json()
    query = body['query']
    return web.json_response({'result': parse_query(query, indexes)})


app = web.Application()
app.add_routes([
    web.post('/storeTokens', handle_store_tokens),
    web.post('/parseQuery', handle_parse_query)
])
