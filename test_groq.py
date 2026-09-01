import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'https://api.groq.com/openai/v1/chat/completions',
    data=json.dumps({
        'model': 'llama3-8b-8192',
        'messages': [{'role': 'user', 'content': 'Say hello'}]
    }).encode('utf-8'),
    headers={
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
    }
)
try:
    response = urllib.request.urlopen(req)
    print('SUCCESS! Key works.', response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('ERROR:', e.code, e.read().decode('utf-8'))
