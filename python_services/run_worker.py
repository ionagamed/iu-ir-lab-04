from aiohttp import web
from services.worker import app


web.run_app(app)
