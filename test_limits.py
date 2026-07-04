import json
import glob
import re

def parse_limits(text):
    text = text.replace(' ', '')
    m1 = re.search(r'\((\d+\.?\d*)-(\d+\.?\d*)[a-zA-Zµ°/O]*\)', text)
    if m1: return float(m1.group(1)), float(m1.group(2))
    m2 = re.search(r'<\s*(\d+\.?\d*)', text)
    if m2: return None, float(m2.group(1))
    m3 = re.search(r'>\s*(\d+\.?\d*)', text)
    if m3: return float(m3.group(1)), None
    return None, None

for file in glob.glob('schemas/*.layout.json'):
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    count = 0
    for field in data.get('fields', []):
        if field.get('ft') == 'number':
            label = field.get('colKey', '') + ' ' + field.get('rowKey', '')
            min_val, max_val = parse_limits(label)
            if min_val is not None or max_val is not None:
                count += 1
                # print(file, label, min_val, max_val)
    if count > 0:
        print(str(count) + ' fields in ' + file)
