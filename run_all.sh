#!/bin/bash

export $(grep -v '^#' common.env | xargs)

concurrently \
  -n storage,tokenizer,master,indexer_am,indexer_nz,crawler,worker,secondary \
  -c red,red,blue,green,green,yellow,yellow,yellow \
  "cd node_services && STORAGE_PATH=$(pwd)/document_storage npm run run:storage | pino-pretty" \
  "cd node_services && npm run run:tokenizer | pino-pretty" \
  "cd node_services && STORAGE_PATH=$(pwd)/master_storage npm run run:master | pino-pretty" \
  "cd node_services && STORAGE_PATH=$(pwd)/indexer_storage_am PORT=4101 npm run run:indexer | pino-pretty" \
  "cd node_services && STORAGE_PATH=$(pwd)/indexer_storage_nz PORT=4102 npm run run:indexer | pino-pretty" \
  "cd python_services && poetry run python3 run_crawler.py" \
  "cd python_services && poetry run python3 run_worker.py" \
  "cd python_services && poetry run python3 run_secondary.py"
