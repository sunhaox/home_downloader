import argparse
import os
from pathlib import Path
import random
import shutil
import subprocess
import download_muti
from loguru import logger

def download_media(output, url, thread_num = 5):
    random_name = str(random.randint(1000,9999))
    if len(output.split('/')) == 1:
        # only file name
        tmp_folder = random_name
    else:
        base_path = output.rsplit('/', 1)
        tmp_folder = base_path[0] + '/' + random_name        
    
    logger.debug(f'tmp folder: {tmp_folder}')
    try:
        dir_path = Path(tmp_folder)
        dir_path.mkdir(parents=True, exist_ok=True)
    except Exception as error:
        logger.error(f'Can not create tmp folder {tmp_folder}: {error}')
        return False
    
    rst = True
    try:
        dl_rst, m3u8_file = download_muti.download(url, thread_num, tmp_folder)
        rst = rst and dl_rst
        result = subprocess.run(['ffmpeg', '-i', m3u8_file, '-c', 'copy', output], capture_output=True, text=True)
        exe_output = result.stdout

        if result.stderr:
            exe_output = result.stderr
            logger.error(f'FFMPEG convert failed: {exe_output}')
            logger.error(f'm3u8: {m3u8_file}')
            logger.error(f'output: {output}')
            rst = False
        
    except Exception as e:
        logger.error(f'download media error: {e}')
        rst = False
    
    if os.path.exists(tmp_folder):
        try:
            shutil.rmtree(tmp_folder)
        except Exception as error:
            logger.error(f'Error happened when deleting tmp folder: {error}')
    else:
        logger.warning(f'tmp folder {tmp_folder} not exist')
    
    return rst

def main():
    global gl_thread_num
    parser = argparse.ArgumentParser(description='Download m3u8 ts files')
    parser.add_argument('-t', '--thread', type=int, help='how much thread used to download', default=1)
    parser.add_argument('-u', '--url', type=str, help='m3u8 url', required=True)
    parser.add_argument('-o', '--output', type=str, help='output file path', required=True)
    
    args = parser.parse_args()
    
    url = args.url
    thread_num = args.thread
    output = args.output
    
    download_media(output, url, thread_num)
    

if __name__ == "__main__":
    main()