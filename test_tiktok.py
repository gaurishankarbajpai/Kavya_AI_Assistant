import requests, base64

def test_tiktok():
    url = "https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke/"
    text = "Haan yaar Himanshu bhadwa hai"
    voice = "en_us_002"
    headers = {"User-Agent": "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; en_US; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)"}
    data = {"req_text": text, "text_speaker": voice, "speaker_map_type": 0, "aid": 1233}
    res = requests.post(url, headers=headers, params=data)
    print(res.status_code, res.text[:200])

test_tiktok()
