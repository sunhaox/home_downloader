import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined, PlayCircleOutlined, ReloadOutlined, DeleteOutlined, FolderOpenOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Drawer, Alert, Tooltip, Divider, Row, Col, Popconfirm, Flex, Progress } from 'antd';
import config from '../config'

interface State {
    drawerOpen: boolean,
    drawerLoading: boolean,
    deviceList: JSX.Element,
    filePath: string
    filesInfo: {name:string, path:string, type:string}[],
    folder: string[],
    storageInfo: {used: string, total: string, persent: number}
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
            ],
            folder: [],
            storageInfo: {used: 'none', total: 'none', persent: 0}
        }

        this.onDrawerClose = this.onDrawerClose.bind(this);
        this.onFileButtonClick = this.onFileButtonClick.bind(this);
        this.onDeviceClick = this.onDeviceClick.bind(this);
        this.onDevicesRefreshButtonClick = this.onDevicesRefreshButtonClick.bind(this);
        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this);
        this.onFileDeleteConfirm = this.onFileDeleteConfirm.bind(this);
        this.onFolderClicked = this.onFolderClicked.bind(this);
        this.onBackButtonClick = this.onBackButtonClick.bind(this);
        this.onRefreshStorageUsedInfo = this.onRefreshStorageUsedInfo.bind(this);

        this.onRefreshButtonClick();
        this.onRefreshStorageUsedInfo();
    }

    render() {
        return (
            <>
                <div className='FilesList-header'>
                    <Flex gap="small" vertical> 
                        <Progress percent={this.state.storageInfo.persent} />
                        Used: {this.state.storageInfo.used} Total: {this.state.storageInfo.total}
                    </Flex>
                    <div style={{textAlign:'left'}}>
                        {this.state.folder.length?this.state.folder.map((val, index) => (
                            '/' + val
                        )): '/'}
                    </div>
                    <Tooltip title="back">
                        <Button type="primary" shape="circle" icon={<ArrowLeftOutlined />} onClick={this.onBackButtonClick} />
                    </Tooltip>
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
                                <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={this.onFileButtonClick} id={'btn-'+index} />
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
                            </>
                            :
                            <>
                            <Col span={20} style={{textAlign: 'left', textOverflow: 'hiden'}} onClick={this.onFolderClicked} id={'folder-'+val.name}>
                                <FolderOpenOutlined />
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
                            </>
                            }
                        </Row>
                        <Divider />
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
            try {
                const response = await fetch(config.host + '/delete', {
                    method: 'POST',
                    headers: new Headers({'Content-Type': 'application/json'}),
                    body: JSON.stringify({file: fileName.path})
                })
    
                console.log(await response.text());

                this.onRefreshButtonClick();
            }
            catch(error) {
                console.log(error);
                // TODO: handle the error
            }            
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

    onRefreshStorageUsedInfo = async() => {
        try {
            const response = await fetch(config.host + '/df');
            const result = await response.text();
            try{
                const json = JSON.parse(result);                
                this.setState({storageInfo: {total: json.total, used: json.used, persent: json.persent}})
            }
            catch(error) {
                // TODO
                console.log(error);
            }
        }
        catch (error) {
            // TODO
            console.log(error);
        }
    }

    onBackButtonClick() {
        let folder = this.state.folder;
        folder.pop();
        this.setState({folder: folder});
        
        let path = '';
        folder.forEach(function(element) {
            path+= '/' + element;
        })
        this.getFilesName(path);
    }

    onFolderClicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        let id = e.currentTarget.id;
        let path = id.substring(7);
        console.log(path);
        let folder = this.state.folder;
        folder.push(path);
        this.setState({folder: folder});

        let pathStr = '';
        folder.forEach(function(element) {
            pathStr+= '/' + element;
        })
        this.getFilesName(pathStr);
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
        let folder = '';
        this.state.folder.forEach(function(element) {
            folder+= '/' + element;
        })
        this.getFilesName(folder);
    }

    tranverseJson(obj:any, rst: {name:string, path:string, type:string}[]) {
        let path = obj['path']
        let folders = obj['folders'];
        if (Array.isArray(folders)) {
            folders.forEach(element => {
                if (typeof element === "string") {
                    rst.push({name: element, path: path + '/' + element, type: 'folder'});
                }
            })
        }
        let files = obj['files'];
        if (Array.isArray(files)) {
            files.forEach(element => {
                if (typeof element === "string") {
                    rst.push({name: element, path: path + '/' + element, type: 'file'});
                }
            })
        }
    }

    getFilesName = async(folder:string) =>{
        try {
            const response = await fetch(config.host + '/ls', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({folder: folder})
            });
            const json = await response.json();
            console.log(json);

            var rst:{name: string, path:string, type:string}[] = [];
            this.tranverseJson(json, rst);

            this.setState({filesInfo: rst});
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default FilesList;