import json
import glob

for file in glob.glob('schemas/*.layout.json'):
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for field in data.get('fields', []):
        key = field.get('colKey', '') + ' | ' + field.get('rowKey', '')
        if 'leak' in key.lower() or 'oil' in key.lower():
            print(file + ' : ' + key + ' -> type: ' + field.get('ft') + ' -> opts: ' + str(field.get('opts')))
