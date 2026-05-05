#!/bin/bash
# ユメカネくん Webチャット起動スクリプト
# .env.localの環境変数を読み込んでサーバーを起動する

set -a
source "$(dirname "$0")/.env.local"
set +a

npm run dev
