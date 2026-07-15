import urllib.request, json
files = []
next_page = ''
while True:
    url = 'https://www.kaggle.com/api/v1/datasets/list/nirmalsankalana/plantdoc-dataset' + ('?pageToken='+next_page if next_page else '')
    req = urllib.request.Request(url)
    data = json.loads(urllib.request.urlopen(req).read().decode())
    files.extend([f['name'] for f in data.get('datasetFiles', []) if 'name' in f])
    if data.get('hasNextPageToken'): 
        next_page = data['nextPageToken']
    else: 
        break
folders = set([f.split('/')[1] for f in files if f.startswith('train/')])
print(sorted(list(folders)))
