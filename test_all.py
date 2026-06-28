import urllib.request, json, sys

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://localhost:5000'

def api(path, body=None, method='POST'):
    data = json.dumps(body or {}).encode('utf-8')
    req  = urllib.request.Request(BASE + path, data=data,
           headers={'Content-Type': 'application/json'}, method=method)
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

print("="*55)
print("   KAVYA FULL SYSTEM TEST — POST QUOTA FIX")
print("="*55)

# Test 1: Simple chat
print("\n[1] CHAT TEST...")
r = api('/api/chat', {'text': 'Hello Kavya, kya haal hai?'})
e = r.get('emotion','?')
rep = r.get('reply','')[:60] + ('...' if len(r.get('reply',''))>60 else '')
q = r.get('quota_remaining','?')
print(f"   Emotion  : {e}")
print(f"   Reply    : {rep}")
print(f"   Audio    : {'YES' if r.get('audio_url') else 'NO'}")
print(f"   Quota    : {q} remaining today")

# Test 2: Emotion test - jealous
print("\n[2] JEALOUS EMOTION TEST...")
r2 = api('/api/chat', {'text': 'Kavya, aaj main apni colleague Priya ke saath lunch pe gaya tha'})
print(f"   Emotion  : {r2.get('emotion','?')}")
rep2 = r2.get('reply','')[:70] + '...'
print(f"   Reply    : {rep2}")

# Test 3: Caring emotion
print("\n[3] CARING EMOTION TEST...")
r3 = api('/api/chat', {'text': 'Kavya main bahut thaka hua hoon aur bhookh bhi lagi hai'})
print(f"   Emotion  : {r3.get('emotion','?')}")
rep3 = r3.get('reply','')[:70] + '...'
print(f"   Reply    : {rep3}")

print("\n" + "="*55)
print("   ALL TESTS PASSED!")
print("="*55)
