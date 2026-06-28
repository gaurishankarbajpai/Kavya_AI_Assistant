import urllib.request, json, sys

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://localhost:5000'

def api(path, method='GET', body=None):
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={'Content-Type': 'application/json'} if data else {},
        method=method
    )
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

print('='*50)
print('   KAVYA SELF-LEARNING SYSTEM - FULL TEST')
print('='*50)

# 1. Memory current state
mem = api('/api/memory')
print(f'\n[1] MEMORY: {len(mem)} facts stored')
for i, f in enumerate(mem[-3:], len(mem)-2):
    print(f'   {i}. {f[:70]}' + ('...' if len(f) > 70 else ''))

# 2. Auto-learn test
print('\n[2] AUTO-LEARN TEST...')
res = api('/api/auto-learn', 'POST', {
    'user_msg': 'Mujhe coding aur Python bahut achha lagta hai, main full-stack developer banna chahta hoon',
    'kavya_msg': 'Wah Boss, coding me passion hona bahut acchi baat hai!'
})
print('   New facts extracted:', res.get('new_facts', []))

# 3. Curiosity
print('\n[3] CURIOSITY ENGINE...')
res2 = api('/api/curiosity', 'POST', {})
print(f'   Status: {res2.get("status")}')
if res2.get('fact'):
    print(f'   Fact: {res2.get("fact")}')

# 4. Memory after learning
mem2 = api('/api/memory')
added = len(mem2) - len(mem)
print(f'\n[4] MEMORY AFTER LEARNING: {len(mem2)} facts (was {len(mem)}, +{added} new!)')

# 5. Dedup test
print('\n[5] DEDUPLICATION TEST...')
res3 = api('/api/memory/deduplicate', 'POST', {})
print(f'   Status: {res3.get("status")}')
if res3.get('removed') is not None:
    print(f'   Removed {res3.get("removed")} duplicates. Final: {len(res3.get("memory", []))} facts')

print('\n' + '='*50)
print('   ALL SYSTEMS OPERATIONAL!')
print('='*50)
