import requests
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

tests = [
    "kya kar rahi ho?",
    "bore ho raha hoon",
    "tu AI hai na?"
]

print("=" * 60)
print("SPEED TEST - Kavya Response Time")
print("=" * 60)

for msg in tests:
    start = time.time()
    try:
        r = requests.post('http://localhost:5000/api/chat', json={'text': msg}, timeout=30)
        elapsed = time.time() - start
        d = r.json()
        emotion = d.get('emotion', '?')
        reply = d.get('reply', 'ERROR')
        print(f"\n[Boss]: {msg}")
        print(f"[Kavya - {emotion}]: {reply}")
        print(f">>> Response time: {elapsed:.2f}s")
        print("-" * 60)
    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[Boss]: {msg}")
        print(f"ERROR after {elapsed:.2f}s: {e}")
        print("-" * 60)
    time.sleep(2)  # avoid rate limit
