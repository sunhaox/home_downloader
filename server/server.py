import json
import threading
from flask import Flask, render_template, request
import re
import subprocess
import os
from flask_cors import CORS
from gevent import pywsgi
import spider
import download_media
app = Flask(__name__)
CORS(app)

CONFIG_PATH="/config/config.json"

db_json_file_path = ''
root_folder = '/storage/media/'
sync_thread = None


@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/read_json', methods=['GET', 'POST'])
def read_json():
    if not os.path.exists(db_json_file_path):
        return {'rst': False, 'error': 'DB file not exist!'}
    
    error = ''
    try:
        with open(db_json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return {'rst': True, 'data': data}
    except FileNotFoundError:
        error = f'Can not find file {db_json_file_path}.'
    except Exception as e:
        error = f"Error happened when reading: {e}"
    return {'rst': False, 'error': error}

@app.route('/test_show_info', methods=['GET', 'POST'])
def test_show_info():
    if request.is_json:
        json_data = request.get_json()
        
        url = json_data['url']
        name = json_data['name']
        
        rst = spider.test(url)
        rst['name'] = name

        return {
            'rst': True,
            'data': rst
        }
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/new_folder', methods=['GET', 'POST'])
def new_folder():
    if request.is_json:
        json_data = request.get_json()
        
        if 'folder' not in json_data:
            return {
                'rst': False,
                'error': f'no "folder" filed in request'
            }
            
        folder_name = json_data['folder']
        
        if folder_name.startswith(root_folder):
            full_path = folder_name
        else:
            full_path = root_folder + '/' + folder_name
        
        os.makedirs(full_path, exist_ok=True)

        return {
            'rst': True
        }
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/submit_show_info', methods=['GET', 'POST'])
def submit_show_info():
    if request.is_json:
        json_data = request.get_json()
        error = ''
        
        if not os.path.exists(db_json_file_path):
            try:
                with open(db_json_file_path, 'w', encoding='utf-8') as file:
                    json.dump([], file, indent=4, ensure_ascii=False)
            except Exception as e:
                error = f"Error happened when creating db {db_json_file_path}: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
        
        data = []
        try:
            with open(db_json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                data.append(json_data)
        except FileNotFoundError:
            error = f'Can not find file {db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when reading: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
    
        try:
            with open(db_json_file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=4, ensure_ascii=False)
                return {'rst': True, 'data': ''}
        except FileNotFoundError:
            error = f'Can not find file {db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when writing: {e}"
        return {'rst': False, 'error': error}

    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/delete_json', methods=['GET', 'POST'])
def delete_json():
    if request.is_json:
        json_data = request.get_json()
        
        if not os.path.exists(db_json_file_path):
            return {'rst': False, 'error': 'DB file not exist!'}
        
        error = ''
        data = []
        try:
            with open(db_json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            error = f'Can not find file {db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when reading: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
    
        new_data = [x for x in data if x['name'] != json_data['name']]

        try:
            with open(db_json_file_path, 'w', encoding='utf-8') as file:
                json.dump(new_data, file, indent=4, ensure_ascii=False)
                return {'rst': True, 'data': ''}
        except FileNotFoundError:
            error = f'Can not find file {db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when writing: {e}"
        return {'rst': False, 'error': error}

    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/media_dl', methods=['GET', 'POST'])
def media_dl():
    global root_folder
    if request.is_json:
        json_data = request.get_json()
        
        url = json_data['url']
        name = json_data['name']
        path = json_data['path']
        
        if not name.endswith('.mp4'):
            return {'rst': False, 'error': 'media type should be mp4'}
        
        if (os.path.exists(root_folder + '/' + path + '/' + name)):
            return {'rst': False, 'error': f'file {root_folder}/{path}/{name} exist!'}
        
        rst = download_media.download_media(root_folder + '/' +path+'/'+name, url, 10)
        
        if rst:
            return {'rst': True}
        else:
            return {'rst': False, 'error': 'download error'}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}
    
@app.route('/sync', methods=['GET', 'POST'])
def sync():
    global sync_thread
    if sync_thread != None:
        if sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}
    
    try:
        thread = threading.Thread(target=spider.fetch)
        thread.start()
        sync_thread = thread
    except Exception as error:
        return {'rst': False, 'error': f'error happended when creating thread: {error}'}
    
    # TODO update result
    return {'rst': True}

@app.route('/sync_test', methods=['GET', 'POST'])
def sync_test():
    global sync_thread
    if sync_thread != None:
        if sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}

    return {'rst': True}

@app.route('/sync_season', methods=['GET', 'POST'])
def sync_season():
    global sync_thread
    if sync_thread != None:
        if sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}
    
    if request.is_json:
        json_data = request.get_json()
        
        name = json_data['name']
        
        #TODO update result
        try:
            thread = threading.Thread(target=spider.fetch_season, args=(name, ))
            thread.start()
            sync_thread = thread
        except Exception as error:
            return {'rst': False, 'error': f'error happended when creating thread: {error}'}
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

@app.route('/ls', methods=['GET', 'POST'])
def list_files():
    global root_folder
    if request.is_json:
        json_data = request.get_json()
        
        folder = json_data['folder']
    
        file_paths = get_files_and_folders(root_folder + folder)
        
        return {'rst': True, 'data': file_paths}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

def get_files_and_folders(folder):
    global root_folder
    file_paths = {}
    file_paths['files'] = []
    file_paths['folders'] = []
    
    if folder.startswith(root_folder):
        path = folder[len(root_folder):]
    else:
        path = folder
    file_paths['path'] = path
    
    with os.scandir(folder) as entries:
        for file_path in entries:
            if file_path.is_file():
                file_paths['files'].append(file_path.name)
            else:
                file_paths['folders'].append(file_path.name)
    
    file_paths['files'].sort()
    file_paths['folders'].sort()
    return file_paths

@app.route('/df', methods=['GET', 'POST'])
def shell_df():
    sdx = ''
    with open('config.json', 'r') as ifile:
        data = json.load(ifile)
        sdx = data['sdx']
    
    result = subprocess.run(['df', '-h'], capture_output=True, text=True)
    output = result.stdout

    if result.stderr:
        output = result.stderr
        return {'rst': False, 'error': output}
    
    str_list = output.split('\n')
    for str in str_list:
        if str.startswith(sdx):
            match = re.search(r'\S+\s+(\S+)\s+(\S+)\s+\S+\s+(\S+)\s+\S+', str)
            if match:
                total = match.group(1)
                used = match.group(2)
                persent = match.group(3)
                persent = int(persent[:-1])
                return {'rst': True, 'data': {'total': total, 'used': used, 'persent': persent}}
    
    return {'rst': True, 'data': {'total': 'x', 'used': 'x', 'persent': 0}}

@app.route('/delete', methods=['GET', 'POST'])
def delete_file():
    global root_folder
    if request.is_json:
        json_data = request.get_json()
        
        fileName = json_data['file']
        rst = True
        e = ''
        
        if os.path.isfile(root_folder + fileName):
            try:
                os.remove(root_folder + fileName)
            except Exception as error:
                rst = False
                e = f'Error happened when delete file {root_folder + fileName}: {error}'
        elif os.path.isdir(root_folder + fileName):
            try:
                os.rmdir(root_folder + fileName)
            except Exception as error:
                rst = False
                e = f'Error happened when delete folder {root_folder + fileName}: {error}'
        if rst:
            return {'rst': True}
        else:
            return {'rst': False, 'error': e}
    else:
        raw_data = request.get_data(as_text=True)
        return {'rst': False, 'error': 'should be json format'}
    
if __name__ == '__main__':
    
    # check the config file
    if (not os.path.exists(CONFIG_PATH)):
        # create the config file if not exist
        data = {}
        data['db_json'] = '/config/db.json'
        data['sdx'] = '/dev/sdb1'
        data['root'] = '/storage/media/'
        
        db_json_file_path = data['db_json']
        root_folder = data['root']
        with open(CONFIG_PATH, 'w') as ofile:
            json.dump(data, ofile, indent=4)
    else:
        with open(CONFIG_PATH, 'r') as ifile:
            data = json.load(ifile)
            db_json_file_path = data['db_json']
            root_folder = data['root']
            
    if (not os.path.exists(db_json_file_path)):
        with open(db_json_file_path, 'w') as file:
            json.dump([], file, indent=4)
    
    # app.run(debug=True, port=8088)
    server = pywsgi.WSGIServer(('0.0.0.0', 8088), app)
    server.serve_forever()
