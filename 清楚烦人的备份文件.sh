#!/system/bin/sh
# 一键清理当前目录及子目录下的所有 .bak 文件
cd "$(dirname "$0")"
echo "开始扫描 .bak 文件..."
count=0
find . -type f -name "*.bak" | while read file; do
    echo "正在删除: $file"
    rm -f "$file"
    count=$((count+1))
done
echo "✅ 清理完成！所有 .bak 文件已清理。"