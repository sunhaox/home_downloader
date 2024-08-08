import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined, PlayCircleOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Drawer, Alert, Tooltip, Divider, Row, Col, Popconfirm } from 'antd';
import config from '../config'

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
            filesName: ["very_long_long_long_long_long_file_name.mp4", "common_file_name.mp4"]
        }

        this.onDrawerClose = this.onDrawerClose.bind(this);
        this.onFileBottonClick = this.onFileBottonClick.bind(this);
        this.onDeviceClick = this.onDeviceClick.bind(this);
        this.onDevicesRefreshButtonClick = this.onDevicesRefreshButtonClick.bind(this);
        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this);
        this.onFileDeleteConfirm = this.onFileDeleteConfirm.bind(this);
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
                    <>
                        <Row>
                            <Col span={16} style={{textAlign: 'left', textOverflow: 'hiden'}}>
                                <FileImageOutlined />
                                {val}
                            </Col>
                            <Col span={4}>
                                <Popconfirm
                                    title="Delete the file"
                                    description="Are you sure to delete this file?"
                                    onConfirm={this.onFileDeleteConfirm}
                                    okText="Yes"
                                    cancelText="No"
                                    okButtonProps={{id: 'del-'+index}}
                                >
                                    <Button shape='circle' type='primary' icon={<DeleteOutlined />} danger></Button>
                                </Popconfirm>
                            </Col>
                            <Col span={4}>
                                <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={this.onFileBottonClick} id={'btn-'+index} />
                            </Col>
                        </Row>
                    </>
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

    async onFileDeleteConfirm(e?: React.MouseEvent<HTMLElement>) {
        if (e) {
            const btnId = e.currentTarget.id;
            const index = btnId.substring(4);
            const fileName = this.state.filesName[Number(index)]
            console.log(fileName);
            const response = await fetch(config.host + '/delete', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({file: fileName})
            })

            console.log(await response.text());
        }
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
            const response = await fetch(config.host + '/go2tv_l');
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
            const response = await fetch(config.host + '/go2tv_s', {
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
            const response = await fetch(config.host + '/ls');
            const result = await response.json();
            this.setState({filesName: result})
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default FilesList;