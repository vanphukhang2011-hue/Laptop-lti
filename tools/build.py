"""Build the CSS bundle with rebased URLs, without third-party dependencies."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/dist/site.css'
STYLES = ['site', 'showcase', 'night-theme', 'rog-intro', 'visual-summary',
          'atmosphere', 'fiber-optics', 'journey', 'letter-light']

def stylesheet(path):
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'@import\s+url\(["\']?([^"\')]+)["\']?\);',
                  lambda m: stylesheet((path.parent / m[1]).resolve()), text)
    def rebase(match):
        url = match[1].strip('"\'')
        if url.startswith(('data:', '#', 'http:', 'https:')): return match[0]
        # Imported font URLs are already rebased by the recursive call.
        if url.startswith('../fonts/'): return match[0]
        target = (path.parent / url).resolve()
        target.relative_to(ROOT)
        assert target.is_file(), f'Missing CSS asset: {target}'
        import os
        return 'url("' + Path(os.path.relpath(target, OUTPUT.parent)).as_posix() + '")'
    return re.sub(r'url\(([^)]+)\)', rebase, text)

def build():
    parts = [stylesheet(ROOT / 'assets/css' / (name + '.css')) for name in STYLES]
    text = '\n'.join(parts)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    text = '\n'.join(line.strip() for line in text.splitlines() if line.strip()) + '\n'
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(text, encoding='utf-8')
    print(f'Built {OUTPUT.relative_to(ROOT)} ({len(text.encode()):,} bytes)')

if __name__ == '__main__': build()
