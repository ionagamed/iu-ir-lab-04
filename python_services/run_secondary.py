from aiohttp import web
from services.secondary import app


web.run_app(app, port=8081)
