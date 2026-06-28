import requests
import time
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

SERVER = 'http://localhost:5000'

tests = [
    ("notepad khol do", "Should OPEN notepad"),
    ("volume kam karo", "Should VOLUME_DOWN"),
    ("screenshot le lo", "Should SCREENSHOT"),
    ("youtube pe arijit singh songs search karo", "Should YOUTUBE search"),
    ("calculator open karo", "Should OPEN calc"),
    ("battery kitni hai", "Should BATTERY"),
    ("notepad band karo", "Should CLOSE notepad"),
]

print("=" * 70)
print("KAVYA FULL PC CONTROL TEST")
print("=" * 70)

passed = 0
failed = 0

for msg, expected in tests:
    time.sleep(2)  # Rate limit protection
    try:
        r = requests.post(f'{SERVER}/api/chat', json={'text': msg}, timeout=30)
        d = r.json()
        cmds = d.get('commands', [])
        reply = d.get('reply', 'ERROR')[:80]
        emotion = d.get('emotion', '?')
        
        cmd_str = ', '.join([f"{c['command']}={'OK' if c['success'] else 'FAIL'}" for c in cmds]) if cmds else 'NONE'
        
        status = 'PASS' if cmds else 'FAIL'
        if cmds:
            passed += 1
        else:
            failed += 1
        
        print(f"\n[{status}] Boss: \"{msg}\"")
        print(f"  Expected: {expected}")
        print(f"  Commands: {cmd_str}")
        print(f"  Kavya [{emotion}]: {reply}")
        print("-" * 70)
    except Exception as e:
        failed += 1
        print(f"\n[ERROR] Boss: \"{msg}\" → {e}")
        print("-" * 70)

print(f"\n{'=' * 70}")
print(f"RESULTS: {passed}/{passed+failed} PASSED")
print(f"{'=' * 70}")
