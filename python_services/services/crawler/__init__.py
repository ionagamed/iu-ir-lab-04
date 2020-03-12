import time
import os
import requests
from .processing import crawl


def run():
    while True:
        # initial delay to wait for indexer startup
        time.sleep(10)
        crawl()

        master_address = os.environ.get('MASTER_ADDRESS')

        # let it simmer for a bit, network delays, event loop task queue, all that stuff
        time.sleep(20)

        print('Finalizing the index')
        requests.post(master_address + '/finalizeRebuildIndex')

        time.sleep(5 * 60)
