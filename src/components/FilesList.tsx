import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined, PlayCircleOutlined, ReloadOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Drawer, Alert, Tooltip, Divider, Row, Col, Popconfirm } from 'antd';
import config from '../config'

interface State {
    drawerOpen: boolean,
    drawerLoading: boolean,
    deviceList: JSX.Element,
    filePath: string
    filesInfo: {name:string, path:string, type:string}[]
}

class FilesList extends Component<{}, State> {

    constructor(props: {}) {
        super(props);

        this.state = {
            drawerOpen: false,
            drawerLoading: false,
            deviceList: <></>,
            filePath: "",
            filesInfo: [
                {name: "very_long_long_long_long_long_file_name.mp4", path: "testpath", type: "file"},
                {name: "common_file_name.mp4", path: "testpath", type: "file"}
            ]
        }

        this.onDrawerClose = this.onDrawerClose.bind(this);
        this.onFileButtonClick = this.onFileButtonClick.bind(this);
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
                
                {this.state.filesInfo.map((val, index) => (
                    <>
                        <Row>
                            {val.type === 'file'?
                            <>
                            <Col span={16} style={{textAlign: 'left', textOverflow: 'hiden'}}>
                                <FileImageOutlined />
                                {val.name}
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
                                <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={this.onFileButtonClick} id={'btn-'+index} />
                            </Col>
                            </>
                            :
                            <Col span={24} style={{textAlign: 'left', textOverflow: 'hiden'}} >
                                <FolderOpenOutlined />
                                {val.name}
                            </Col>
                            }
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
            const fileName = this.state.filesInfo[Number(index)]
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

    onFileButtonClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        this.setState({drawerOpen: true})

        const btnId = e.currentTarget.id;
        const index = btnId.substring(4);
        const fileInfo = this.state.filesInfo[Number(index)];
        this.setState({filePath: fileInfo.path})
        console.log(fileInfo);
        
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
        let file = this.state.filePath;
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

    tranverseJson(obj:any, rst: {name:string, path:string, type:string}[], path:string, level = 0) {
        Object.keys(obj).forEach(key => {
            if (key === 'file') {
                let arr = obj[key];
                if (Array.isArray(arr)) {
                    arr.forEach(element => {
                        if (typeof element === "string") {
                            rst.push({name: '\u00A0\ \u00A0 |'.repeat(level) + element, path: path + '/' + element, type: 'file'});
                        }
                    })
                }
            }
            else if (key === 'folder' &&
                     (typeof obj === 'object' && obj !== null)){
                this.tranverseJson(obj[key], rst, path, level);
            }
            else {
                rst.push({name: '\u00A0\ \u00A0 |'.repeat(level) + key, path: path + '/' + key, type: 'folder'});
                this.tranverseJson(obj[key], rst, path + '/' + key, level + 1);
            }
        });
    }

    getFilesName = async() =>{
        try {
            const response = await fetch(config.host + '/ls');
            const json = await response.json();
            console.log(json);

            var rst:{name: string, path:string, type:string}[] = [];
            this.tranverseJson(json, rst, '');

            this.setState({filesInfo: rst});
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default FilesList;