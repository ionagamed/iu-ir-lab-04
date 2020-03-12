from aiohttp import web

from .tokenize import handle_tokenize


app = web.Application()
app.add_routes([
    web.post("/tokenize", handle_tokenize)
])
