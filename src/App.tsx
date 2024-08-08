import React, { Component } from 'react';
import './App.css';
import { Spin, Tabs, TabsProps } from 'antd';
import FilesList from './components/FilesList';
import PlayingList from './components/PlayingList'

interface State {
    loading: boolean
}

class App extends Component<{}, State> {

    items: TabsProps['items'] = [];

    constructor(props: {}) {
        super(props);
        this.state = {
            loading: false
        }

        this.items = [
            {
                key: '1',
                label: 'Files',
                children: <div>
                            <FilesList></FilesList>
                        </div>,
            },
            {
                key: '2',
                label: 'Playing',
                children: <><PlayingList></PlayingList></>,
            }
        ];
    }

    render() {
        return (
            <>
                <div className='App-loading' style={{ display: this.state.loading ? "block" : 'none' }}>
                    <Spin tip="Loading">
                        <div className="content" />
                    </Spin>
                </div>
                <div className="App" style={{ display: this.state.loading ? "none" : 'block' }}>
                    <Tabs defaultActiveKey='1' items={this.items} />
                </div>
            </>
        );
    }


}

export default App;