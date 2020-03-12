from aiohttp import web
from .text_processing import preprocess


async def handle_tokenize(request: web.Request):
    body = await request.json()
    tokens = preprocess(body["text"])
    return web.json_response({"tokens": tokens})
