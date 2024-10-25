import json
from flask import Flask, render_template, request
import re
import subprocess
import os
from flask_cors import CORS
from gevent import pywsgi
app = Flask(__name__)
CORS(app)


db_json_file_path = ''
root_folder = '/storage/media/'


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
        
        # TODO Return value
        return {
            'rst': True,
            'data': {
                'name': name,
                'url': url,
                'list': {
                    'ep1': {
                        'name': 'ep1',
                        'url': 'test.url.com/ep1',
                        'media': 'test.url.com/ep1.m3u8'
                    },
                    'ep2': {
                        'name': 'ep2',
                        'url': 'test.url.com/ep1',
                        'media': 'test.url.com/ep1.m3u8'
                    }
                }
            }
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

@app.route('/ls', methods=['GET', 'POST'])
def list_files():
        
    if request.is_json:
        json_data = request.get_json()
        
        folder = json_data['folder']
    
        file_paths = get_files_and_folders(root_folder + folder)
        
        return {'rst': True, 'data': file_paths}
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return {'rst': False, 'error': 'should be json format'}

def get_files_and_folders(folder, last_file = ''):
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
                if (file_path == last_file):
                    file_paths['files'].append(file_path.name + "*")
                else:
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
    if request.is_json:
        json_data = request.get_json()
        
        fileName = json_data['file']
        
        if os.path.isfile(root_folder + fileName):
            os.remove(root_folder + fileName)
        elif os.path.isdir(root_folder + fileName):
            os.rmdir(root_folder + fileName)
        
        return {'rst': True}
    else:
        raw_data = request.get_data(as_text=True)
        return {'rst': False, 'error': 'should be json format'}
    
if __name__ == '__main__':
    
    # check the config file
    if (not os.path.exists("config.json")):
        # create the config file if not exist
        data = {}
        data['db_json'] = 'db.json'
        data['sdx'] = '/dev/sdb1'
        data['root'] = '/storage/media/'
        with open('config.json', 'w') as ofile:
            json.dump(data, ofile, indent=4)
    else:
        with open('config.json', 'r') as ifile:
            data = json.load(ifile)
            db_json_file_path = data['db_json']
            root_folder = data['root']
    
    # app.run(debug=True, port=8088)
    server = pywsgi.WSGIServer(('0.0.0.0', 8088), app)
    server.serve_forever()
