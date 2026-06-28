content = open('app.py', 'r', encoding='utf-8').read()

# Find and fix the error handler block
import re

# Replace the bad error handler with a clean one
pattern = r'        # Handle API Quota cleanly\s*\n        if "429" in str\(e\) or "Quota exceeded" in str\(e\):.*?return jsonify\(\{"error": str\(e\)\}\), 500'
replacement = '''        # Handle API errors gracefully
        err_str = str(e)
        if any(x in err_str for x in ["429", "Quota exceeded", "ResourceExhausted", "NotFound"]):
            return jsonify({
                "reply": "Boss, thodi der baad baat karte hain na please!",
                "tts_text": "\u092c\u0949\u0938, \u0925\u094b\u0921\u093c\u0940 \u0926\u0947\u0930 \u092c\u093e\u0926 \u092c\u093e\u0924 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902 \u0928\u093e \u092a\u094d\u0932\u0940\u091c\u093c?",
                "emotion": "sad",
                "audio_url": None
            })
        return jsonify({"error": err_str}), 500'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
if new_content != content:
    open('app.py', 'w', encoding='utf-8').write(new_content)
    print("SUCCESS: error handler fixed!")
else:
    print("Pattern not found - already fixed or different format")
    # Print lines 435-446 for debug
    lines = content.split('\n')
    for i, l in enumerate(lines[433:446], 434):
        print(f"  {i}: {repr(l[:80])}")
