import React, { useEffect, useState } from 'react';
import './App.css';
import { Tabs, TabsProps } from 'antd';
import WatchList from './components/WatchList';
import AddWidget from './components/AddWidget';
import FilesList from './components/FilesList';
import DownloadWidget from './components/DownloadWidget';
import AboutWidget from './components/AboutWidget';
import Settings from './components/Settings';

const App: React.FC = () => {

    const [activeKey, setActiveKey] = useState<string>('1');
    const [downloadName, setDownloadName] = useState<string>('');
    const [downloadUrl, setDownloadUrl] = useState<string>('');

    const updateDownloadInfo = (name:string, url:string) => {
        console.log(`name: ${name}  url: ${url}`);
        setDownloadName(name);
        setDownloadUrl(url);
        setActiveKey('4');
    }

    const [items, setItems] = useState<TabsProps['items']>([
        {
            key: '1',
            label: 'Watch List',
            children: <div>
                        <WatchList updateDownloadInfo={updateDownloadInfo}></WatchList>
                    </div>,
            forceRender: true
        },
        {
            key: '2',
            label: 'Add',
            children: <><AddWidget></AddWidget></>,
        },
        {
            key: '3',
            label: 'Explorer',
            children: <><FilesList></FilesList></>
        },
        {
            key: '4',
            label: 'Download',
            children: <><DownloadWidget dlName={downloadName} dlUrl={downloadUrl} ></DownloadWidget></>,
            destroyInactiveTabPane: true
        },
        {
            key: '5',
            label: 'Settings',
            children: <><Settings></Settings></>
        },
        {
            key: '6',
            label: 'About',
            children: <><AboutWidget></AboutWidget></>
        }
    ]);

    const onChange = (key:string) => {
        setActiveKey(key);
    }

    useEffect(() => {
        setItems((prevItems) => [
            {
                key: '1',
                label: 'Watch List',
                children: <div>
                            <WatchList updateDownloadInfo={updateDownloadInfo}></WatchList>
                        </div>,
                forceRender: true
            },
            {
                key: '2',
                label: 'Add',
                children: <><AddWidget></AddWidget></>,
            },
            {
                key: '3',
                label: 'Explorer',
                children: <><FilesList></FilesList></>
            },
            {
                key: '4',
                label: 'Download',
                children: <><DownloadWidget dlName={downloadName} dlUrl={downloadUrl} ></DownloadWidget></>,
                destroyInactiveTabPane: true
            },
            {
                key: '5',
                label: 'Settings',
                children: <><Settings></Settings></>
            },
            {
                key: '6',
                label: 'About',
                children: <><AboutWidget></AboutWidget></>
            }
        ])
    }, [downloadName])

    return (
        <>
            <div className="App">
                <Tabs items={items} activeKey={activeKey} onChange={onChange} />
            </div>
        </>
    );


}

export default App;