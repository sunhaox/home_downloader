import json
import threading
from flask import Flask, render_template, request
import re
import subprocess
import os
import shutil
from flask_cors import CORS
from gevent import pywsgi
import spider
import download_media
app = Flask(__name__)
CORS(app)

CONFIG_PATH="/config/config.json"

gl_db_json_file_path = ''
gl_root_folder = '/storage/media/'
gl_sync_thread = None
gl_download_info = []
gl_download_thread_num = 10
gl_download_timeout = 30

class DownloadInfo:
    def __init__(self, name, path, media, thread = None):
        self.name = name        # output file name
        self.path = path        # output file folder
        self.media = media      # m3u8 url
        self.state = ''         # string state
        self.thread = thread    # Thread obj
        self.status = True      # processing status, break when it's False
    
    def to_dict(self):
        if self.thread == None:
            return {
                'name': self.name,
                'path': self.path,
                'media': self.media,
                'state': self.state,
                'thread': ''
            }
        return {
            'name': self.name,
            'path': self.path,
            'media': self.media,
            'state': self.state,
            'thread': self.thread.getName()
        }

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/read_json', methods=['GET', 'POST'])
def read_json():
    global gl_db_json_file_path
    if not os.path.exists(gl_db_json_file_path):
        return {'rst': False, 'error': 'DB file not exist!'}
    
    error = ''
    try:
        with open(gl_db_json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return {'rst': True, 'data': data}
    except FileNotFoundError:
        error = f'Can not find file {gl_db_json_file_path}.'
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
    global gl_root_folder
    if request.is_json:
        json_data = request.get_json()
        
        if 'folder' not in json_data:
            return {
                'rst': False,
                'error': f'no "folder" filed in request'
            }
            
        folder_name = json_data['folder']
        
        if folder_name.startswith(gl_root_folder):
            full_path = folder_name
        else:
            full_path = gl_root_folder + '/' + folder_name
        
        os.makedirs(full_path, exist_ok=True)

        return {
            'rst': True
        }
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/rename', methods=['GET', 'POST'])
def rename():
    global gl_root_folder
    if request.is_json:
        json_data = request.get_json()
        
        if 'new' not in json_data or 'old' not in json_data:
            return {
                'rst': False,
                'error': f'Miss filed "new" or "old" in request'
            }
            
        new_path = json_data['new']
        old_path = json_data['old']
        
        if new_path.startswith(gl_root_folder):
            new_path = new_path
        else:
            new_path = gl_root_folder + '/' + new_path
            
        if old_path.startswith(gl_root_folder):
            old_path = old_path
        else:
            old_path = gl_root_folder + '/' + old_path
        
        os.rename(old_path, new_path)

        return {
            'rst': True
        }
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/submit_show_info', methods=['GET', 'POST'])
def submit_show_info():
    global gl_db_json_file_path
    if request.is_json:
        json_data = request.get_json()
        error = ''
        
        if not os.path.exists(gl_db_json_file_path):
            try:
                with open(gl_db_json_file_path, 'w', encoding='utf-8') as file:
                    json.dump([], file, indent=4, ensure_ascii=False)
            except Exception as e:
                error = f"Error happened when creating db {gl_db_json_file_path}: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
        
        data = []
        try:
            with open(gl_db_json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                data.append(json_data)
        except FileNotFoundError:
            error = f'Can not find file {gl_db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when reading: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
    
        try:
            with open(gl_db_json_file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=4, ensure_ascii=False)
                return {'rst': True, 'data': ''}
        except FileNotFoundError:
            error = f'Can not find file {gl_db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when writing: {e}"
        return {'rst': False, 'error': error}

    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/delete_json', methods=['GET', 'POST'])
def delete_json():
    global gl_db_json_file_path
    if request.is_json:
        json_data = request.get_json()
        
        if not os.path.exists(gl_db_json_file_path):
            return {'rst': False, 'error': 'DB file not exist!'}
        
        error = ''
        data = []
        try:
            with open(gl_db_json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            error = f'Can not find file {gl_db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when reading: {e}"
        
        if error != '':
            return {'rst': False, 'error': error}
    
        new_data = [x for x in data if x['name'] != json_data['name']]

        try:
            with open(gl_db_json_file_path, 'w', encoding='utf-8') as file:
                json.dump(new_data, file, indent=4, ensure_ascii=False)
                return {'rst': True, 'data': ''}
        except FileNotFoundError:
            error = f'Can not find file {gl_db_json_file_path}.'
        except Exception as e:
            error = f"Error happened when writing: {e}"
        return {'rst': False, 'error': error}

    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return {'rst': False, 'error': 'should be json format'}

@app.route('/media_dl', methods=['GET', 'POST'])
def media_dl():
    global gl_root_folder
    global gl_download_info
    global gl_download_thread_num
    global gl_download_timeout
    if request.is_json:
        json_data = request.get_json()
        
        url = json_data['url']
        name = json_data['name']
        path = json_data['path']
        
        if not name.endswith('.mp4'):
            return {'rst': False, 'error': 'media type should be mp4'}
        
        # TODO what if download same file twice?
        if (os.path.exists(gl_root_folder + '/' + path + '/' + name)):
            return {'rst': False, 'error': f'file {gl_root_folder}/{path}/{name} exist!'}
        
        try:
            di = DownloadInfo(name, path, url)
            thread = threading.Thread(target=download_media.download_media, args=(gl_root_folder+'/'+path+'/'+name, url, gl_download_thread_num, gl_download_timeout, di))
            di.thread = thread
            thread.start()
            gl_download_info.append(di)
        except Exception as error:
            return {'rst': False, 'error': f'error happened when creating thread: {error}'}
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

@app.route('/media_dl_info', methods=['GET', 'POST'])
def media_dl_info():
    global gl_download_info
    rst = []
    for info in gl_download_info:
        rst.append(info.to_dict())

    return {'rst': True, 'data': rst}

@app.route('/media_dl_delete', methods=['GET', 'POST'])
def media_dl_delete():
    global gl_download_info
    
    if request.is_json:
        json_data = request.get_json()
        
        thread = json_data['thread']
        
        new_arr = [x for x in gl_download_info if x.thread.getName() != thread]
    
        gl_download_info = new_arr
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}
    
@app.route('/sync', methods=['GET', 'POST'])
def sync():
    global gl_sync_thread
    global gl_db_json_file_path
    global gl_download_timeout
    if gl_sync_thread != None:
        if gl_sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}
    
    try:
        thread = threading.Thread(target=spider.fetch, args=(gl_db_json_file_path, gl_download_timeout))
        thread.start()
        gl_sync_thread = thread
    except Exception as error:
        return {'rst': False, 'error': f'error happened when creating thread: {error}'}
    
    # TODO update result
    return {'rst': True}

@app.route('/sync_test', methods=['GET', 'POST'])
def sync_test():
    global gl_sync_thread
    if gl_sync_thread != None:
        if gl_sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}

    return {'rst': True}

@app.route('/sync_season', methods=['GET', 'POST'])
def sync_season():
    global gl_sync_thread
    global gl_db_json_file_path
    global gl_download_timeout
    if gl_sync_thread != None:
        if gl_sync_thread.is_alive():
            return {'rst': False, 'error': 'Now is syncing, try later.'}
    
    if request.is_json:
        json_data = request.get_json()
        
        name = json_data['name']
        
        #TODO update result
        try:
            thread = threading.Thread(target=spider.fetch_season, args=(name, gl_db_json_file_path, gl_download_timeout))
            thread.start()
            gl_sync_thread = thread
        except Exception as error:
            return {'rst': False, 'error': f'error happened when creating thread: {error}'}
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

@app.route('/ls', methods=['GET', 'POST'])
def list_files():
    global gl_root_folder
    if request.is_json:
        json_data = request.get_json()
        
        folder = json_data['folder']
    
        file_paths = get_files_and_folders(gl_root_folder + folder)
        
        return {'rst': True, 'data': file_paths}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

def get_files_and_folders(folder):
    global gl_root_folder
    file_paths = {}
    file_paths['files'] = []
    file_paths['folders'] = []
    
    if folder.startswith(gl_root_folder):
        path = folder[len(gl_root_folder):]
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
    with open(CONFIG_PATH, 'r') as ifile:
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
                percent = match.group(3)
                percent = int(percent[:-1])
                return {'rst': True, 'data': {'total': total, 'used': used, 'percent': percent}}
    
    return {'rst': True, 'data': {'total': 'x', 'used': 'x', 'percent': 0}}

@app.route('/delete', methods=['GET', 'POST'])
def delete_file():
    global gl_root_folder
    if request.is_json:
        json_data = request.get_json()
        
        fileName = json_data['file']
        rst = True
        e = ''
        
        if os.path.isfile(gl_root_folder + fileName):
            try:
                os.remove(gl_root_folder + fileName)
            except Exception as error:
                rst = False
                e = f'Error happened when delete file {gl_root_folder + fileName}: {error}'
        elif os.path.isdir(gl_root_folder + fileName):
            try:
                shutil.rmtree(gl_root_folder + fileName)
            except Exception as error:
                rst = False
                e = f'Error happened when delete folder {gl_root_folder + fileName}: {error}'
        if rst:
            return {'rst': True}
        else:
            return {'rst': False, 'error': e}
    else:
        raw_data = request.get_data(as_text=True)
        return {'rst': False, 'error': 'should be json format'}
    
@app.route('/settings_get', methods=['GET', 'POST'])
def settings_get():
    if (not os.path.exists(CONFIG_PATH)):
        return {'rst': False, 'error': 'Config file not exist!'}
    
    with open(CONFIG_PATH, 'r') as ifile:
        data = json.load(ifile)
        return {'rst': True, 'data': data}

    return {'rst': False, 'error': 'error happened when getting settings'}

@app.route('/settings_set', methods=['GET', 'POST'])
def settings_set():
    global gl_root_folder
    if request.is_json:
        json_data = request.get_json()
        
        with open(CONFIG_PATH, 'w') as ofile:
            json.dump(json_data, ofile, indent=4)
            
        init_settings()
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        return {'rst': False, 'error': 'should be json format'}

def init_settings():
    global gl_db_json_file_path
    global gl_root_folder
    global gl_download_thread_num
    global gl_download_timeout
    with open(CONFIG_PATH, 'r') as ifile:
        data = json.load(ifile)
        gl_db_json_file_path = data['db_json']
        gl_root_folder = data['root']
        gl_download_thread_num = data['download_thread_num']
        gl_download_timeout = data['download_timeout']
    
    # For debug
    # print(f'gl_db_json_file_path: {gl_db_json_file_path}')
    # print(f'gl_root_folder: {gl_root_folder}')
    # print(f'gl_download_thread_num: {gl_download_thread_num}')
    # print(f'gl_download_timeout: {gl_download_timeout}')

if __name__ == '__main__':
    # check the config file
    if (not os.path.exists(CONFIG_PATH)):
        # create the config file if not exist
        data = {}
        data['db_json'] = '/config/db.json'
        data['sdx'] = '/dev/sdb1'
        data['root'] = '/storage/media/'
        data['download_thread_num'] = 10
        data['download_timeout'] = 30
        
        gl_db_json_file_path = data['db_json']
        gl_root_folder = data['root']
        with open(CONFIG_PATH, 'w') as ofile:
            json.dump(data, ofile, indent=4)
    else:
        init_settings()
            
    if (not os.path.exists(gl_db_json_file_path)):
        with open(gl_db_json_file_path, 'w') as file:
            json.dump([], file, indent=4)
    
    # app.run(debug=True, port=8088)
    server = pywsgi.WSGIServer(('0.0.0.0', 8088), app)
    server.serve_forever()
