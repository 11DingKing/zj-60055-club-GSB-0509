#!/bin/bash

set -e

echo "=== 社团活动管理系统启动脚本 ==="

DB_USER="dev"
DB_PASS="dev123456"
DB_NAME="db_zj_60055"
PG_CONTAINER="dev-postgres"

echo ""
echo "检查并创建数据库..."

DB_EXISTS=$(docker exec -e PGPASSWORD=$DB_PASS $PG_CONTAINER psql -U $DB_USER -d dev_db -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null || echo "")

if echo "$DB_EXISTS" | grep -q "1"; then
    echo "数据库 $DB_NAME 已存在"
else
    echo "数据库 $DB_NAME 不存在，正在创建..."
    docker exec -e PGPASSWORD=$DB_PASS $PG_CONTAINER psql -U $DB_USER -d dev_db -c "CREATE DATABASE $DB_NAME"
    echo "数据库 $DB_NAME 创建成功"
fi

echo ""
echo "启动 Docker Compose 服务..."
echo "前端端口: 16055"
echo "后端端口: 13055"
echo ""

docker compose up --build
