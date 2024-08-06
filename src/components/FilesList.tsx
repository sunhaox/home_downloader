import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Drawer, Alert, Tooltip, Divider } from 'antd';

interface State {
    drawerOpen: boolean,
    drawerLoading: boolean,
    deviceList: JSX.Element,
    fileName: string
    filesName: string[]
}

class FilesList extends Component<{}, State> {

    constructor(props: {}) {
        super(props);

        this.state = {
            drawerOpen: false,
            drawerLoading: false,
            deviceList: <></>,
            fileName: "",
            filesName: []
        }

        this.onDrawerClose = this.onDrawerClose.bind(this);
        this.onFileBottonClick = this.onFileBottonClick.bind(this);
        this.onDeviceClick = this.onDeviceClick.bind(this);
        this.onDevicesRefreshButtonClick = this.onDevicesRefreshButtonClick.bind(this);
        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this)
    }

    render() {
        return (
            <>
                <div className='FilesList-header'>
                    <Tooltip title="refresh">
                        <Button type="primary" shape="circle" icon={<ReloadOutlined />} onClick={this.onRefreshButtonClick} />
                    </Tooltip>
                </div>
                <Divider />
                
                {this.state.filesName.map((val, index) => (
                    <div className='FilesList'>
                        <div className='FilesList-left'>
                            <FileImageOutlined />
                            {val}
                        </div>
                        <div className='FilesList-right'>
                            <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={this.onFileBottonClick} id={'btn-'+index} />
                        </div>
                    </div>
                ))}

                <Drawer
                    title="Choose the device"
                    placement={"top"}
                    closable={false}
                    onClose={this.onDrawerClose}
                    open={this.state.drawerOpen}
                    loading={this.state.drawerLoading}
                    key={"top"}
                >
                    <Button type='primary' shape='circle' icon={<ReloadOutlined />} onClick={this.onDevicesRefreshButtonClick}></Button>
                    {this.state.deviceList}
                </Drawer>
            </>
        );
    }

    onDrawerClose() {
        this.setState({drawerOpen: false})
    }

    onFileBottonClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        this.setState({drawerOpen: true})

        const btnId = e.currentTarget.id;
        const index = btnId.substring(4);
        const fileName = this.state.filesName[Number(index)];
        this.setState({fileName: fileName})
        console.log(fileName);
        
    }

    onDevicesRefreshButtonClick = async() =>{
        this.setState({drawerLoading: true})
        try {
            const response = await fetch('/go2tv_l');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                let deviceListElements = [];
                
                for( let i = 0; i < json['devices'].length; i++) {
                    deviceListElements.push(<p onClick={this.onDeviceClick} id={json['devices'][i]['URL']}>{json['devices'][i]['model']}</p>)
                }

                const rst = <>{deviceListElements}</>
                this.setState({deviceList: rst})
            }
            catch(error) {
                const errorString = String(error);
                this.setState({deviceList: <>
                    <Alert message={result} type="error" />
                    <Alert message={String(error)} type="error" />
                </>})
            }
        }
        catch (error) {
            const errorString = String(error);
            this.setState({deviceList: <>
                <Alert message={errorString} type="error" />
            </>})
        }

        this.setState({drawerLoading: false})
    }

    async onDeviceClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        let url = e.currentTarget.id;
        let file = this.state.fileName;
        console.log(e.currentTarget.innerText);
        console.log(e.currentTarget.id);

        try {
            const response = await fetch('/go2tv_s', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({filename: file, url: url})
            })

            console.log(await response.text());
        }
        catch(error) {
            console.log(error);
        }
    }

    onRefreshButtonClick() {
        // TODO get json and update
        this.getFilesName();
    }

    getFilesName = async() =>{
        try {
            const response = await fetch('/ls');
            const result = await response.json();
            this.setState({filesName: result})
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default FilesList;