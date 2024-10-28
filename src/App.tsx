import React, { Component } from 'react';
import './App.css';
import { Tabs, TabsProps } from 'antd';
import WatchList from './components/WatchList';
import AddWidget from './components/AddWidget';
import FilesList from './components/FilesList';
import DownloadWidget from './components/DownloadWidget';

interface State {
    activeKey: string;
    download_name: string;
    download_url: string;
}

class App extends Component<{}, State> {

    items: TabsProps['items'] = [];

    constructor(props: {}) {
        super(props);

        this.state = {
            activeKey: '1',
            download_name: '123',
            download_url: ''
        }

        this.onChange = this.onChange.bind(this);
        this.updateDownloadInfo = this.updateDownloadInfo.bind(this)

        this.items = [
            {
                key: '1',
                label: 'Watch List',
                children: <div>
                            <WatchList updateDownloadInfo={this.updateDownloadInfo}></WatchList>
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
                label: 'Exploer',
                children: <><FilesList></FilesList></>
            },
            {
                key: '4',
                label: 'Download',
                children: <><DownloadWidget dlName={this.state.download_name} dlUrl={this.state.download_url} ></DownloadWidget></>,
                destroyInactiveTabPane: true
            }
        ];
    }

    updateDownloadInfo(name:string, url:string) {
        // TODO Need to investigate why the name and url not send to DownloadWidget
        console.log(`name: ${name}  url: ${url}`)
        this.setState({download_name: name, download_url: url, activeKey: '4'})
    }

    onChange(key:string) {
        this.setState({activeKey: key});
    }

    render() {
        return (
            <>
                <div className="App">
                    <Tabs items={this.items} activeKey={this.state.activeKey} onChange={this.onChange} />
                </div>
            </>
        );
    }


}

export default App;