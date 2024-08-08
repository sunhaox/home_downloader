import time
from flask import Flask, render_template, request
import re
import subprocess
import os
from flask_cors import CORS
from gevent import pywsgi
app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/ps', methods=['GET', 'POST'])
def shell_ps():
    result = subprocess.run(['ps', '-C', 'go2tv'], capture_output=True, text=True)
    output = result.stdout

    if result.stderr:
        output = result.stderr
        return output
    
    pid_pattern = re.compile(r'\s+(\d+)\s')

    output = pid_pattern.findall(output)
    return output

@app.route('/ls', methods=['GET', 'POST'])
def list_files():
    file_paths = []
    for root, dirs, files in os.walk('/storage/media'):
        for file in files:
            file_paths.append(file)
    
    # sort the array
    file_paths.sort()
    
    return file_paths

@app.route('/go2tv_l', methods=['GET', 'POST'])
def shell_go2tv_l():
    result = subprocess.run(['go2tv', '-l'], capture_output=True, text=True)
    output = result.stdout
    
    '''
    Device 1
    --------
    Model: 咪咕投屏-20F
    URL:   http://192.168.1.5:53141/upnp/dev/a003a3a7de2f31af96041aac27414292/desc

    Device 2
    --------
    Model: 魔百和_11820F
    URL:   http://192.168.1.5:25826/description.xml
    '''

    if result.stderr:
        output = result.stderr
        return output
    else:
        pattern = r'Model: (.*)\nURL:\s+(.*)'
        
        # There are some invisible chars need to remove first
        sub1_chr = [chr(27), chr(91), chr(48), chr(109)]
        sub1_str = ''.join((chr) for chr in sub1_chr)
        
        sub2_chr = [chr(27), chr(91), chr(49), chr(109)]
        sub2_str = ''.join((chr) for chr in sub2_chr)
        
        output = output.replace(sub1_str, '')
        output = output.replace(sub2_str, '')

        matches = re.findall(pattern, output)
        output = {'devices': []}

        for match in matches:
            output['devices'].append({'model': match[0], 'URL': match[1]})

    print(output)
    return output
    # For test
    # return {"devices": [
    #     {'model': 'models1', 'url': 'http://example.com/xml'},
    #     {'model': 'models2', 'url': 'http://example.com/xml'}
    # ]}

@app.route('/go2tv_s', methods=['GET', 'POST'])
def shell_go2tv_s():
    if request.is_json:
        json_data = request.get_json()
        
        url = json_data['url']
        file = json_data['filename']
        file = '/storage/media/' + file
    
        completion = subprocess.Popen(['go2tv', '-t', url, '-v', file], shell=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
 
        return str(completion.pid)
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return "123"

@app.route('/kill', methods=['GET', 'POST'])
def shell_kill():
    if request.is_json:
        json_data = request.get_json()
        
        pid = json_data['pid']
    
        result = subprocess.run(['kill', pid], capture_output=True, text=True)
        output = result.stdout

        if result.stderr:
            output = result.stderr
            return output
        
        return output
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
    return "123"

@app.route('/delete', methods=['GET', 'POST'])
def delete_file():
    if request.is_json:
        json_data = request.get_json()
        
        fileName = json_data['file']
        
        os.remove('/storage/media/' + fileName)
        return ''
    else:
        raw_data = request.get_data(as_text=True)
        print(raw_data)
        return raw_data

if __name__ == '__main__':
    # app.run(debug=True, port=8088)
    server = pywsgi.WSGIServer(('0.0.0.0', 8088), app)
    server.serve_forever()
