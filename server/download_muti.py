import argparse
from collections import Counter
import os
import subprocess
import threading
import requests
from loguru import logger

class downloader:
    
    def __init__(self):
        self.gl_progress = []

    @staticmethod
    def _is_ts_reference(line):
        path = line.strip().split('?', 1)[0].lower()
        return path.endswith('.ts')

    @staticmethod
    def _is_m3u8_reference(line):
        path = line.strip().split('?', 1)[0].lower()
        return path.endswith('.m3u8')

    @staticmethod
    def _local_ts_file_name(line):
        return line.strip().split('?', 1)[0]

    @staticmethod
    def _probe_ts_resolution(file_path):
        try:
            result = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height',
                '-of', 'csv=s=x:p=0',
                file_path
            ], capture_output=True, text=True)
        except Exception as error:
            logger.warning(f'Can not probe resolution for {file_path}: {error}')
            return None

        if result.returncode != 0:
            logger.warning(f'ffprobe failed for {file_path}: {result.stderr}')
            return None

        for line in result.stdout.splitlines():
            line = line.strip()
            if 'x' not in line:
                continue

            width, height = line.split('x', 1)
            if width.isdigit() and height.isdigit():
                return int(width), int(height)

        logger.warning(f'No video resolution found for {file_path}')
        return None

    def _filter_m3u8_by_resolution(self, m3u8_list, tmp_folder):
        resolutions = []
        resolution_by_ts = {}
        missing_ts = set()
        unprobed_ts = set()

        for line in m3u8_list:
            ts_file = line.strip()
            if not self._is_ts_reference(ts_file):
                continue

            local_path = os.path.join(tmp_folder, self._local_ts_file_name(ts_file))
            if not os.path.exists(local_path):
                logger.warning(f'TS file not found when filtering m3u8: {local_path}')
                missing_ts.add(ts_file)
                continue

            resolution = self._probe_ts_resolution(local_path)
            if resolution == None:
                unprobed_ts.add(ts_file)
                continue

            resolutions.append(resolution)
            resolution_by_ts[ts_file] = resolution

        if len(set(resolutions)) <= 1 and len(missing_ts) == 0 and len(unprobed_ts) == 0:
            return m3u8_list, 0

        target_resolution = Counter(resolutions).most_common(1)[0][0] if resolutions else None
        removed_ts = set(missing_ts)
        removed_ts.update(unprobed_ts)
        if target_resolution != None:
            removed_ts.update({
                ts_file
                for ts_file, resolution in resolution_by_ts.items()
                if resolution != target_resolution
            })

        filtered_list = []
        segment_block = []
        removed_count = 0

        for raw_line in m3u8_list:
            line = raw_line.strip()

            if self._is_ts_reference(line):
                if line in removed_ts:
                    segment_block = []
                    removed_count += 1
                else:
                    filtered_list.extend(segment_block)
                    filtered_list.append(self._local_ts_file_name(line))
                    segment_block = []
                continue

            if line.startswith('#EXTINF'):
                if segment_block:
                    filtered_list.extend(segment_block)
                segment_block = [raw_line]
                continue

            if segment_block:
                segment_block.append(raw_line)
            else:
                filtered_list.append(raw_line)

        if segment_block:
            filtered_list.extend(segment_block)

        if target_resolution != None:
            logger.info(
                f'Filtered {removed_count} ts references. '
                f'Target resolution: {target_resolution[0]}x{target_resolution[1]}, '
                f'missing: {len(missing_ts)}, unprobed: {len(unprobed_ts)}'
            )
        else:
            logger.info(
                f'Filtered {removed_count} ts references. '
                f'Missing: {len(missing_ts)}, unprobed: {len(unprobed_ts)}'
            )
        return filtered_list, removed_count

    def _save_m3u8_file(self, m3u8_list, tmp_folder, file_name):
        filtered_list, _ = self._filter_m3u8_by_resolution(m3u8_list, tmp_folder)
        file_path = os.path.join(tmp_folder, file_name)
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write('\n'.join(filtered_list))
            file.write('\n')
        return file_path

    def download_ts(self, base_url, list, num, range, tmp_folder, timeout = 30, download_info = None):
        new_list = list[num * range: min((num + 1) * range, len(list))]
        for index, str in enumerate(new_list):
            if download_info != None and download_info.status == False:
                break
            
            str = str.strip()
            if str.startswith('#') or str == '':
                continue
            local_file_name = self._local_ts_file_name(str)
            local_file_path = os.path.join(tmp_folder, local_file_name)
            if os.path.exists(local_file_path):
                self.gl_progress[num] = index
                logger.debug(f't{num}: {sum(self.gl_progress)}/{len(list)} exist: {str}')
                continue
            try:
                response = requests.get(base_url + '/' + str, stream=True, timeout=timeout)
                # 检查请求是否成功
                if response.status_code == 200:
                    if self._is_ts_reference(str):
                        local_dir = os.path.dirname(local_file_path)
                        if local_dir:
                            os.makedirs(local_dir, exist_ok=True)

                        with open(local_file_path, 'wb') as file:
                            for chunk in response.iter_content(chunk_size=8192):
                                file.write(chunk)
                        self.gl_progress[num] = index
                        downloaded = sum(self.gl_progress)
                        if download_info != None:
                            download_info.state = f'downloading {downloaded}/{len(list)}'
                        logger.debug(f't{num}: {downloaded}/{len(list)} downloaded: {str}')
                    else:
                        logger.error(f'Error: wrong file type: {str}')
            except Exception as e:
                logger.error(f'Error happened when fetch {base_url + "/" + str}: {e}')
                if download_info != None:
                    download_info.status = False
                    download_info.state = f'Error {base_url + "/" + str}: {e}'
                break
        logger.debug(f'download {num} finished')
                        
    def download(self, url, thread_num, tmp_folder = './', timeout = 30, download_info = None):
        try:
            if download_info != None:
                download_info.state = 'fetching m3u8 list'
            
            logger.debug(f'try to fetch {url}')
            with requests.get(url, stream=True, timeout=timeout) as response:
                # 检查请求是否成功
                if response.status_code == 200:
                    type = url.strip().split('?', 1)[0].split('.')[-1]
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
                            elif self._is_m3u8_reference(str):
                                str = str.strip()
                                base_url = url.rsplit('/', 1)
                                rst, index_file = self.download(base_url[0] + '/' + str, thread_num, tmp_folder, timeout, download_info)
                                if rst:
                                    return rst, index_file
                            elif self._is_ts_reference(str):
                                base_url = url.rsplit('/', 1)[0]
                                flag = True
                                threads = []
                                self.gl_progress = [0 for _ in range(thread_num)]
                                for i in range(thread_num):
                                    thread = threading.Thread(target=self.download_ts, args=(base_url, str_list, i, int(len(str_list)/thread_num)+1, tmp_folder, timeout, download_info))
                                    threads.append(thread)
                                    thread.start()
                                break
                        
                        if flag:
                            # 等待线程执行完成
                            for thread in threads:
                                thread.join()
                            # 保存m3u8文件，并剔除不同分辨率的ts引用
                            m3u8_name = url.strip().split('?', 1)[0].split('/')[-1]
                            m3u8_file = self._save_m3u8_file(str_list, tmp_folder, m3u8_name)
                            return True, m3u8_file
                    else:
                        logger.debug('其他文件类型，跳过')
                else:
                    logger.error("下载失败，状态码:", response.status_code)
                    
                return False, ''
        except Exception as e:
            logger.error(f'Download {url} failed: {e}')
            if download_info != None:
                download_info.status = False
                download_info.state = f'Download error: {e}'
            return False, ''

def main():
    parser = argparse.ArgumentParser(description='Download m3u8 ts files')
    parser.add_argument('-t', '--thread', type=int, help='how much thread used to download', default=1)
    parser.add_argument('-u', '--url', type=str, help='m3u8 url', required=True)
    
    args = parser.parse_args()
    
    url = args.url
    thread_num = args.thread
    
    d = downloader()
    d.download(url, thread_num)

if __name__ == "__main__":
    main()
