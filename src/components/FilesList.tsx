import React, { Component } from 'react';
import './FilesList.css';
import { FileImageOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Drawer } from 'antd';

interface Props {
    files: string[]
}

interface State {
    drawerOpen: boolean,
    drawerLoading: boolean,
    deviceList: JSX.Element
}

class FilesList extends Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            drawerOpen: false,
            drawerLoading: false,
            deviceList: <></>
        }

        this.onDrawerClose = this.onDrawerClose.bind(this);
        this.onFileBottonClick = this.onFileBottonClick.bind(this);
    }

    render() {
        return (
            <>
                {this.props.files.map((val, index) => (
                    <div className='FilesList'>
                        <div className='FilesList-left'>
                            <FileImageOutlined />
                            {val}
                        </div>
                        <div className='FilesList-right'>
                            <Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={this.onFileBottonClick} />
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
                    {this.state.deviceList}
                </Drawer>
            </>
        );
    }

    onDrawerClose() {
        this.setState({drawerOpen: false})
    }

    onFileBottonClick() {
        this.setState({drawerOpen: true})

        // TODO Get the file name
        
        // TODO get json
        this.setState({drawerLoading: true})
        setTimeout(() => {
            this.onAjaxEvent();
        }, 2000)
    }

    onAjaxEvent() {
        // TODO analyse response
        this.setState({deviceList: <>
            <ul>
                <li>tv</li>
                <li>魔百盒TV</li>
            </ul>
        </>})

        this.setState({drawerLoading: false})
    }
}

export default FilesList;