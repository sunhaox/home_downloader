import React, { Component } from 'react';
import './App.css';
import { Spin, Tooltip, Button, Divider } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import FilesList from './components/FilesList';

interface State {
    loading: boolean,
    filesName: string[]
}

class App extends Component<{}, State> {

    constructor(props: {}) {
        super(props);
        this.state = {
            loading: false,
            filesName: ["file1.mp4", "file2.mp4"]
        }

        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this)
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
                    <div className='App-header'>
                        <Tooltip title="refresh">
                            <Button type="primary" shape="circle" icon={<ReloadOutlined />} onClick={this.onRefreshButtonClick} />
                        </Tooltip>
                    </div>
                    <Divider />
                    <div>
                        <FilesList files={this.state.filesName}></FilesList>
                    </div>
                </div>
            </>
        );
    }

    onRefreshButtonClick() {
        // TODO get json and update
        this.getFilesName();
    }

    getFilesName = async() =>{
        try {
            const response = await fetch('http://localhost:8088/ls');
            const result = await response.json();
            this.setState({filesName: result})
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default App;