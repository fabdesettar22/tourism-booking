#!/bin/bash

echo "🚀 بدء تشغيل سيرفرات You Need Travel..."

# تشغيل Django Backend
osascript -e 'tell app "Terminal"
  do script "cd ~/Desktop/tourism_booking && python manage.py runserver"
  activate
end tell'

# تشغيل React Frontend
osascript -e 'tell app "Terminal"
  do script "cd ~/Desktop/tourism_booking/frontend && npm run dev"
  activate
end tell'

echo "✅ تم فتح نافذتين:"
echo "   • Django  → http://127.0.0.1:8000"
echo "   • React   → http://localhost:3000"
echo ""
echo "اضغط Ctrl + C في أي نافذة لإيقاف السيرفر."
