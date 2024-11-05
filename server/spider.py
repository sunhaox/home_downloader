import argparse
import os
import requests
from bs4 import BeautifulSoup
import re
from loguru import logger
import json

JSON_FILE = './db.json'

class SeasonInfo:
    def __init__(self, name = '', url = '') -> None:
        self.name = name
        self.url = url
        self.list: dict[str, ListInfo] = {}
        
    def to_dict(self):
        return {'name': self.name, 'url': self.url, 'list': {title:self.list[title].to_dict() for title in self.list}}
        
class ListInfo:
    def __init__(self, title = '', url = '', media = '') -> None:
        self.title = title
        self.media = media
        self.url = url
        
    def to_dict(self):
        return {'title': self.title, 'url': self.url, 'media': self.media}

def init_season_info_from_json(season_json):
    if 'name' not in season_json or \
        'url' not in season_json or \
        'list' not in season_json:
            logger.warning(f'Miss filed in {season_json}')
            return None
    
    if type(season_json['name']) != str:
        logger.warning(f'Wrong "name" filed type: {season_json["name"]}')
        return None

    if type(season_json['url']) != str:
        logger.warning(f'Wrong "url" filed type: {season_json["url"]}')
        return None
    
    season = SeasonInfo(season_json['name'], season_json['url'])
    for item in season_json['list']:
        list_info = init_list_info_from_json(season_json['list'][item])
        if list_info:
            season.list[list_info.title] = list_info
    return season

def init_list_info_from_json(list_json):
    if 'title' not in list_json or \
        'media' not in list_json or \
        'url' not in list_json:
            logger.warning(f'Miss filed in {list_json}')
            return None
    
    if type(list_json['title']) != str:
        logger.warning(f'Wrong "name" filed type: {list_json["title"]}')
        return None

    if type(list_json['media']) != str:
        logger.warning(f'Wrong "name" filed type: {list_json["media"]}')
        return None
    
    if type(list_json['url']) != str:
        logger.warning(f'Wrong "name" filed type: {list_json["url"]}')
        return None
    
    return ListInfo(list_json['title'], list_json['url'], list_json['media'])

def get_chaptor_list(url:str) -> dict[str, ListInfo]:
    if url == '':
        return {}
    
    rst = {}
    try:
        response = requests.get(url, timeout=10)
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = soup.select('div#down1 a')
        
        for link in links:
            href = link.get('href')
            title = link.get('title')
            logger.debug(f'title: {title} href: {href}')
            rst[title] = ListInfo(title, "http://www.sogohosting.com" + href)
            logger.debug(f'list url: {rst[title].url}')
    except Exception as e:
        logger.error(f'Error happened when fetch list info {url}: {e}')
    return rst

def getIFrame(url:str):
    if url == '':
        return ''
    
    rst = ''
    try:
        response = requests.get(url, timeout=10)
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = soup.select('iframe')
        
        for link in links:
            src_rst = link.get('src')
            if type(src_rst) == str:
                rst = src_rst
                break
            elif type(src_rst) == list[str]:
                rst = src_rst[0]
                break
    except Exception as e:
        logger.error(f'Error happened when fetch iframe info {url}: {e}')
    
    logger.debug(f'page: {url}')
    logger.debug(f'iframe: {rst}')
    return rst

def get_m3u8(url:str) -> str:
    if url == '':
        return ''
    
    rst = ''
    try:
        response = requests.get(url, timeout=1)
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = soup.select('script')

        for link in links:
            match = re.search(r'var\svid=\"(https?:\/\/[\da-zA-Z\/\.\_\-]+)\"', link.text)
            if match:
                rst = match.group(1)
                break
    except Exception as e:
        logger.error(f'Error happened when fetch media info {url}: {e}')
    
    logger.debug(f'iframe: {url}')
    logger.debug(f'm3u8: {rst}')
    return rst

def get_new_list(url: str) -> dict[str, ListInfo]:
    rst = get_chaptor_list(url)
    for title in rst:
        iframe_link = getIFrame(rst[title].url)
        media_link = get_m3u8(iframe_link)
        rst[title].media = media_link
    return rst

def compare_new_with_old(old_list: dict[str, ListInfo], new_list: dict[str, ListInfo]) -> dict[str, ListInfo]:
    rst = {}
    for title in new_list:
        if title not in old_list:
            rst[title] = new_list[title]
            
    return rst

def download_media(url: str) -> bool:
    # TODO
    return True

def update_info(db:list[SeasonInfo]) -> list[SeasonInfo]:
    for season_info in db:
        new_list = get_new_list(season_info.url)
        added_list = compare_new_with_old(season_info.list, new_list)
        for title in added_list:
            rst = download_media(added_list[title].media)
            if rst:
                season_info.list[title] = added_list[title]
                logger.info(f'successfully download {season_info.name}-{title}')
    return db

def read_info(file_name: str) -> list[SeasonInfo]:
    if not os.path.exists(file_name):
        logger.warning(f'Json file {file_name} not exist.')
        return []
    
    rst = []
    try:
        with open(file_name, 'r', encoding='utf-8') as file:
            data = json.load(file)
            rst = []
            for season_json in data:
                season_info = init_season_info_from_json(season_json)
                if season_info:
                    rst.append(season_info)
    except FileNotFoundError:
        logger.error(f'Can not find file {file_name}.')
    except Exception as e:
        logger.error(f"Error happened when reading: {e}")
    return rst

def write_info(file_name: str, db: list[ListInfo]):
    try:
        with open(file_name, 'w', encoding='utf-8') as file:
            data = []
            for item in db:
                data.append(item.to_dict())
            json.dump(data, file, indent=4, ensure_ascii=False)
    except FileNotFoundError:
        logger.error(f'Can not find file {file_name}.')
    except Exception as e:
        logger.error(f"Error happened when reading: {e}")

def fetch(json_file = JSON_FILE):
    db = read_info(json_file)
    new_db = update_info(db)
    write_info(json_file, new_db)
    
def fetch_season(name, json_file = JSON_FILE):
    db = read_info(json_file)
    target_db = []
    for season in db:
        if season.name == name:
            # shallow copy
            target_db = [season]
            break
    if len(target_db) != 1:
        return False, "Can not find target season"
    
    new_db = update_info(target_db)
    
    # shallow copy, so the original db has been changed
    # just write it back to json
    write_info(json_file, db)
    return True, ""

def test(url):
    # create a SeasonInfo instance
    s = SeasonInfo('test', url)
    new_list = get_new_list(s.url)
    s.list = new_list
    return s.to_dict()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-t', '--test', action= 'store_true', help='just test the url')
    parser.add_argument('-f', '--fetch', action='store_true', help='fetch and update')
    parser.add_argument('-u', '--url', type=str, help='Test web url', default='')
    
    args = parser.parse_args()
    
    if args.fetch:
        fetch()
    elif args.test:
        if args.url == '':
            logger.error(f'Need to input the web url!')
            return
        else:
            return test(args.url)
    

if __name__ == "__main__":
    main()