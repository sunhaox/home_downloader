import React, { Component } from 'react';
import './App.css';
import { Tabs, TabsProps } from 'antd';
import WatchList from './components/WatchList';
import AddWidget from './components/AddWidget';
import FilesList from './components/FilesList';

class App extends Component<{}, {}> {

    items: TabsProps['items'] = [];

    constructor(props: {}) {
        super(props);

        this.items = [
            {
                key: '1',
                label: 'Watch List',
                children: <div>
                            <WatchList></WatchList>
                        </div>,
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
            }
        ];
    }

    render() {
        return (
            <>
                <div className="App">
                    <Tabs defaultActiveKey='1' items={this.items} />
                </div>
            </>
        );
    }


}

export default App;