import argparse
import os
import threading
import requests
from loguru import logger

gl_progress = []

def download_ts(base_url, list, num, range, tmp_folder):
    global gl_progress
    new_list = list[num * range: min((num + 1) * range, len(list))]
    for index, str in enumerate(new_list):
        if str.startswith('#') or str == '':
            continue
        if os.path.exists(tmp_folder+'/'+str):
            gl_progress[num] = index
            logger.debug(f't{num}: {sum(gl_progress)}/{len(list)} exist: {str}')
            continue
        with requests.get(base_url + '/' + str, stream=True) as response:
            # 检查请求是否成功
            if response.status_code == 200:
                type = str.split('.')[-1]
                if type == 'ts':
                    with open(tmp_folder+'/'+str, 'wb') as file:
                        for chunk in response.iter_content(chunk_size=8192):
                            file.write(chunk)
                    gl_progress[num] = index
                    downloaded = sum(gl_progress)
                    logger.debug(f't{num}: {downloaded}/{len(list)} downlowded: {str}')
                else:
                    logger.error(f'Error: wrong file type: {str}')
    logger.debug(f'download {num} finished')
                    
def download(url, thread_num, tmp_folder = './'):
    global gl_progress
    with requests.get(url, stream=True) as response:
        # 检查请求是否成功
        if response.status_code == 200:
            type = url.split('.')[-1]
            if type == 'ts':
                with open(url.split('/')[-1], 'wb') as file:
                    # 按块读取响应内容并写入文件
                    for chunk in response.iter_content(chunk_size=8192):
                        file.write(chunk)
            elif type == 'm3u8':
                str_list = response.text.split('\n')
                flag = False
                for index, str in enumerate(str_list):
                    if str.startswith('#'):
                        continue
                    elif str.endswith('m3u8'):
                        base_url = url.rsplit('/', 1)
                        rst, index_file = download(base_url[0] + '/' + str, thread_num, tmp_folder)
                        if rst:
                            return rst, index_file
                    elif str.endswith('ts'):
                        base_url = url.rsplit('/', 1)[0]
                        flag = True
                        threads = []
                        gl_progress = [0 for _ in range(thread_num)]
                        for i in range(thread_num):
                            thread = threading.Thread(target=download_ts, args=(base_url, str_list, i, int(len(str_list)/thread_num)+1, tmp_folder))
                            threads.append(thread)
                            thread.start()
                        break
                
                if flag:
                    # 等待线程执行完成
                    for thread in threads:
                        thread.join()
                    # 保存m3u8文件
                    with open(tmp_folder + '/' + url.split('/')[-1], 'wb') as file:
                        for chunk in response.iter_content(chunk_size=8192):
                            file.write(chunk)
                    
                    return True, tmp_folder + '/' +url.split('/')[-1]
            else:
                logger.debug('其他文件类型，跳过')
        else:
            logger.error("下载失败，状态码:", response.status_code)
            
        return False, ''

def main():
    parser = argparse.ArgumentParser(description='Download m3u8 ts files')
    parser.add_argument('-t', '--thread', type=int, help='how much thread used to download', default=1)
    parser.add_argument('-u', '--url', type=str, help='m3u8 url', required=True)
    
    args = parser.parse_args()
    
    url = args.url
    thread_num = args.thread
    
    download(url, thread_num)

if __name__ == "__main__":
    main()