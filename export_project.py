#!/usr/bin/env python3
"""
MYBRIDGE — Project Export Tool
────────────────────────────────
يجمع كل ملفات المشروع (Backend + Frontend + Config) في ملف txt واحد
لمراجعة شاملة للمشروع.

الاستخدام:
    cd ~/Desktop/tourism_booking
    python3 export_project.py
    
الناتج:
    mybridge_project_export_YYYYMMDD_HHMM.txt
"""

import os
import sys
from datetime import datetime
from pathlib import Path


# ══════════════════════════════════════════════════════════════════
# الإعدادات
# ══════════════════════════════════════════════════════════════════

# الامتدادات المطلوب تصديرها
INCLUDE_EXTENSIONS = {
    # Python
    '.py',
    # Frontend
    '.ts', '.tsx', '.js', '.jsx',
    # Config
    '.json', '.toml', '.yml', '.yaml', '.ini', '.cfg',
    # Templates
    '.html', '.css', '.scss',
    # Docs
    '.md', '.txt',
    # Env (بحذر)
    '.env.example',
}

# ملفات خاصة بالاسم (بدون امتداد)
INCLUDE_FILENAMES = {
    'Dockerfile',
    'Procfile',
    'requirements.txt',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    '.gitignore',
    'manage.py',
    'README.md',
}

# المجلدات المُستبعدة تماماً
EXCLUDE_DIRS = {
    # Python
    'venv', '__pycache__', '.pytest_cache', '.mypy_cache',
    # Git
    '.git', '.github',
    # Node
    'node_modules', 'dist', 'build', '.next',
    # IDE
    '.vscode', '.idea', '.claude',
    # Media/uploads
    'media', 'staticfiles', 'static_collected',
    # Logs
    'logs',
    # Backups
    'backup', 'backups',
    # Tests coverage
    'htmlcov', '.coverage',
}

# الملفات المُستبعدة
EXCLUDE_FILES = {
    '.env',                 # يحتوي أسرار!
    '.env.local',
    '.env.production',
    'db.sqlite3',
    'package-lock.json',    # ضخم جداً وغير مفيد
    'yarn.lock',
    'pnpm-lock.yaml',
    'poetry.lock',
    '.DS_Store',
}

# الامتدادات المُستبعدة (حتى لو من ضمن المضمّنة)
EXCLUDE_EXTENSIONS = {
    '.pyc', '.pyo', '.pyd',
    '.log',
    '.sqlite3', '.db',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.pdf', '.zip', '.tar', '.gz',
    '.woff', '.woff2', '.ttf', '.eot',
    '.mp4', '.mp3', '.mov',
    '.backup',   # ملفات backup
}

# أنماط للاستبعاد (regex-like)
EXCLUDE_PATTERNS = [
    '.backup_',          # ملفات *.backup_*
    '.backup.',
    '.pyc',
    'migrations/__init__',  # ملفات __init__ فارغة في migrations
]

# الحد الأقصى لحجم الملف (لتجنب ملفات ضخمة غير ضرورية)
MAX_FILE_SIZE_KB = 500


# ══════════════════════════════════════════════════════════════════
# الدوال المساعدة
# ══════════════════════════════════════════════════════════════════

def should_include_file(filepath: Path) -> tuple[bool, str]:
    """يحدد إذا كان يجب تضمين الملف + السبب"""
    
    name = filepath.name
    ext = filepath.suffix.lower()
    
    # استبعاد بالاسم
    if name in EXCLUDE_FILES:
        return False, f"ملف مُستبعد: {name}"
    
    # استبعاد بالامتداد
    if ext in EXCLUDE_EXTENSIONS:
        return False, f"امتداد مُستبعد: {ext}"
    
    # استبعاد بالنمط
    for pattern in EXCLUDE_PATTERNS:
        if pattern in name:
            return False, f"نمط مُستبعد: {pattern}"
    
    # تضمين بالاسم
    if name in INCLUDE_FILENAMES:
        return True, "ملف محدد"
    
    # تضمين بالامتداد
    if ext in INCLUDE_EXTENSIONS:
        return True, f"امتداد مدعوم"
    
    return False, "غير مدعوم"


def is_excluded_dir(path: Path) -> bool:
    """يحدد إذا كان المسار يحتوي مجلد مُستبعد"""
    parts = path.parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
    return False


def format_size(size_bytes: int) -> str:
    """تنسيق الحجم"""
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes/1024:.1f}KB"
    else:
        return f"{size_bytes/(1024*1024):.1f}MB"


def get_file_tree(root: Path, output_lines: list) -> None:
    """يولّد شجرة الملفات"""
    output_lines.append("")
    output_lines.append("=" * 80)
    output_lines.append("  شجرة المشروع — File Tree")
    output_lines.append("=" * 80)
    output_lines.append("")
    
    all_files = []
    for filepath in sorted(root.rglob('*')):
        if filepath.is_file() and not is_excluded_dir(filepath.relative_to(root)):
            include, _ = should_include_file(filepath)
            if include:
                all_files.append(filepath.relative_to(root))
    
    # عرض كشجرة
    for f in all_files:
        parts = f.parts
        indent = '  ' * (len(parts) - 1)
        output_lines.append(f"{indent}├── {parts[-1]}")
    
    output_lines.append("")
    output_lines.append(f"إجمالي الملفات: {len(all_files)}")
    output_lines.append("")


def export_project(root_dir: str = '.', output_file: str | None = None) -> str:
    """الدالة الرئيسية للتصدير"""
    
    root = Path(root_dir).resolve()
    
    if not root.exists():
        print(f"❌ المسار غير موجود: {root}")
        sys.exit(1)
    
    # اسم ملف الناتج
    if output_file is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        output_file = f"mybridge_project_export_{timestamp}.txt"
    
    output_path = Path(output_file).resolve()
    
    print("=" * 80)
    print("  MYBRIDGE — Project Export")
    print("=" * 80)
    print(f"📂 المجلد المصدر:  {root}")
    print(f"📄 ملف الناتج:     {output_path}")
    print("=" * 80)
    print()
    
    output_lines = []
    stats = {
        'total_files':    0,
        'included_files': 0,
        'skipped_files':  0,
        'total_bytes':    0,
        'errors':         0,
        'by_extension':   {},
    }
    
    # ── Header ──────────────────────────────────────────────────
    output_lines.append("#" * 80)
    output_lines.append("#")
    output_lines.append("#  MYBRIDGE — MYBRIDGE Travel Platform")
    output_lines.append("#  Project Export — Full Codebase Snapshot")
    output_lines.append("#")
    output_lines.append(f"#  Generated:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output_lines.append(f"#  Root:       {root}")
    output_lines.append("#")
    output_lines.append("#" * 80)
    output_lines.append("")
    
    # ── File Tree ──────────────────────────────────────────────
    get_file_tree(root, output_lines)
    
    # ── محتوى الملفات ──────────────────────────────────────────
    output_lines.append("=" * 80)
    output_lines.append("  محتوى الملفات — File Contents")
    output_lines.append("=" * 80)
    output_lines.append("")
    
    # جمع كل الملفات أولاً (للعرض المرتب)
    all_files_sorted = []
    for filepath in root.rglob('*'):
        if not filepath.is_file():
            continue
        
        rel_path = filepath.relative_to(root)
        
        if is_excluded_dir(rel_path):
            continue
        
        stats['total_files'] += 1
        
        include, reason = should_include_file(filepath)
        if not include:
            stats['skipped_files'] += 1
            continue
        
        # فحص الحجم
        try:
            size = filepath.stat().st_size
            if size > MAX_FILE_SIZE_KB * 1024:
                stats['skipped_files'] += 1
                print(f"⚠️  تخطي (حجم كبير): {rel_path} ({format_size(size)})")
                continue
        except OSError:
            continue
        
        all_files_sorted.append((rel_path, filepath, size))
    
    # ترتيب: Backend أولاً، ثم Frontend، ثم Config
    def sort_key(item):
        rel_path = item[0]
        parts = rel_path.parts
        
        # أولويات
        if parts[0] == 'config':
            return (0, str(rel_path))
        if parts[0] == 'apps':
            return (1, str(rel_path))
        if parts[0] == 'manage.py' or parts[0] == 'requirements.txt':
            return (2, str(rel_path))
        if parts[0] == 'frontend':
            return (3, str(rel_path))
        return (4, str(rel_path))
    
    all_files_sorted.sort(key=sort_key)
    
    # كتابة كل ملف
    for rel_path, filepath, size in all_files_sorted:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            ext = filepath.suffix.lower()
            stats['by_extension'][ext] = stats['by_extension'].get(ext, 0) + 1
            stats['included_files'] += 1
            stats['total_bytes'] += size
            
            # كتابة الرأس
            output_lines.append("")
            output_lines.append("═" * 80)
            output_lines.append(f"  📄 {rel_path}")
            output_lines.append(f"     الحجم: {format_size(size)}  |  السطور: {content.count(chr(10))+1}")
            output_lines.append("═" * 80)
            output_lines.append("")
            output_lines.append(content)
            output_lines.append("")
            
            print(f"✅ {rel_path} ({format_size(size)})")
            
        except Exception as e:
            stats['errors'] += 1
            output_lines.append(f"\n⚠️ خطأ في قراءة {rel_path}: {e}\n")
            print(f"❌ {rel_path} — {e}")
    
    # ── Footer / Stats ─────────────────────────────────────────
    output_lines.append("")
    output_lines.append("=" * 80)
    output_lines.append("  إحصائيات — Statistics")
    output_lines.append("=" * 80)
    output_lines.append("")
    output_lines.append(f"إجمالي الملفات المفحوصة:  {stats['total_files']}")
    output_lines.append(f"الملفات المُضمّنة:        {stats['included_files']}")
    output_lines.append(f"الملفات المُستبعدة:       {stats['skipped_files']}")
    output_lines.append(f"الأخطاء:                  {stats['errors']}")
    output_lines.append(f"الحجم الإجمالي:           {format_size(stats['total_bytes'])}")
    output_lines.append("")
    output_lines.append("التوزيع حسب الامتداد:")
    for ext, count in sorted(stats['by_extension'].items(), key=lambda x: -x[1]):
        output_lines.append(f"  {ext or '(بدون)':12} {count:4} ملف")
    output_lines.append("")
    output_lines.append("=" * 80)
    output_lines.append(f"تم التصدير بنجاح في: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output_lines.append("=" * 80)
    
    # ── كتابة الملف ─────────────────────────────────────────────
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output_lines))
        
        print()
        print("=" * 80)
        print(f"🎉 تم بنجاح!")
        print("=" * 80)
        print(f"📄 الملف:          {output_path}")
        print(f"📊 الملفات:        {stats['included_files']} ملف")
        print(f"💾 الحجم:          {format_size(output_path.stat().st_size)}")
        print()
        print("يمكنك الآن:")
        print(f"  1. فتحه:        open {output_path}")
        print(f"  2. أو نسخ:      cat {output_path} | pbcopy")
        print("=" * 80)
        
        return str(output_path)
        
    except Exception as e:
        print(f"❌ خطأ في الكتابة: {e}")
        sys.exit(1)


if __name__ == '__main__':
    # يمكن تمرير مسار مخصص
    if len(sys.argv) > 1:
        export_project(sys.argv[1])
    else:
        export_project('.')
