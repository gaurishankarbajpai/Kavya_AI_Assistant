import re
c = open('app.py','r',encoding='utf-8').read()
c2 = re.sub(r'GROQ_API_KEY = os\.environ\.get\("GROQ_API_KEY", "[^"]*"\)', 'GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "YOUR_KEY_HERE")', c)
open('app.py','w',encoding='utf-8').write(c2)
m = re.search(r'GROQ_API_KEY', c2)
print('Key placeholder set' if m else 'NOT FOUND')
