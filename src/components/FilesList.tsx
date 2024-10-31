import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined,  ReloadOutlined, DeleteOutlined, FolderOpenOutlined, ArrowLeftOutlined, FolderAddOutlined } from '@ant-design/icons';
import { Button, Tooltip, Divider, Row, Col, Popconfirm, Flex, Progress, message, Modal, Input } from 'antd';
import config from '../config'

interface State {
    filesInfo: {name:string, path:string, type:string}[],
    folder: string[],
    storageInfo: {used: string, total: string, persent: number},
    isModalOpen: boolean,
    newFolderName: string
}

class FilesList extends Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            filesInfo: [
                {name: "very_long_long_long_long_long_file_name.mp4", path: "testpath", type: "file"},
                {name: "common_file_name.mp4", path: "testpath", type: "file"}
            ],
            folder: [],
            storageInfo: {used: 'none', total: 'none', persent: 0},
            isModalOpen: false,
            newFolderName: ''
        }

        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this);
        this.onFileDeleteConfirm = this.onFileDeleteConfirm.bind(this);
        this.onFolderClicked = this.onFolderClicked.bind(this);
        this.onBackButtonClick = this.onBackButtonClick.bind(this);
        this.onRefreshStorageUsedInfo = this.onRefreshStorageUsedInfo.bind(this);
        this.onAddFolderButtonClick = this.onAddFolderButtonClick.bind(this);
        this.onModalOk = this.onModalOk.bind(this);
        this.onModalCancle = this.onModalCancle.bind(this);

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
                    <Tooltip title="add">
                        <Button type="primary" shape="circle" icon={<FolderAddOutlined  />} onClick={this.onAddFolderButtonClick} />
                    </Tooltip>
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
                            <Col span={20} style={{textAlign: 'left', textOverflow: 'hiden'}}>
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

                <Modal title="Add Folder" open={this.state.isModalOpen} onOk={this.onModalOk} onCancel={this.onModalCancle}>
                    <p>New Folder Name:</p>
                    <Input onChange={(e) => {
                        this.setState({newFolderName: e.target.value})
                    }}/>
                </Modal>
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
    
                const result = await response.text();
                try{
                    const json = JSON.parse(result);
                    if (json['rst'] === true) {
                        message.success('File deleted succefully.')
                    }
                    else {
                        message.error(<>Delete file failed: {json['error']}</>)
                    }
                }
                catch(error) {
                    message.error(<>Error happened when processing delete data: {error}</>)
                }

                this.onRefreshButtonClick();
            }
            catch(error) {
                message.error(<>Error happened when fetch {config.host}/delete: {error}</>)
            }            
        }
    }

    onRefreshStorageUsedInfo = async() => {
        try {
            const response = await fetch(config.host + '/df');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] === true) {
                    this.setState({storageInfo: {total: json['data'].total, used: json['data'].used, persent: json['data'].persent}})
                }
                else {
                    message.error(<>Get storeage used info failed: {json['error']}</>)
                }
            }
            catch(error) {
                message.error(<>Error happened when processing storage used info data: {error}</>)
            }
        }
        catch (error) {
            message.error(<>Error happened fetch from {config.host}/df: {error}</>)
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
            if (json['rst'] === true) {
                var rst:{name: string, path:string, type:string}[] = [];
                this.tranverseJson(json['data'], rst);

                this.setState({filesInfo: rst});
            }
            else {
                message.error(json['error'])
            }
        }
        catch (error) {
            message.error(<>Error happened when fetch {config.host}/ls: {error}</>)
        }
    }

    onAddFolderButtonClick() {
        this.setState({isModalOpen: true});
    }

    async onModalOk() {
        console.log(`new folder name: ${this.state.newFolderName}`);
        try {
            const response = await fetch(config.host + '/new_folder', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({folder: this.state.folder + '/' + this.state.newFolderName})
            });
            const json = await response.json();
            console.log(json);
            if (json['rst'] === true) {
                message.success('New folder added successfuly')
            }
            else {
                message.error(json['error'])
            }

            this.onRefreshButtonClick();
        }
        catch (error) {
            message.error(<>Error happened when fetch {config.host}/new_folder: {error}</>)
        }
        this.setState({isModalOpen: false});
    }

    onModalCancle() {
        this.setState({isModalOpen: false});
    }
}

export default FilesList;