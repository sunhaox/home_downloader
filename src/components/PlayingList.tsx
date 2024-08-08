import React, { Component } from 'react';
import './PlayingList.css';
import { Button, Col, Divider, Row, Tooltip } from 'antd';
import { ReloadOutlined, PlaySquareOutlined, CloseOutlined } from '@ant-design/icons';
import config from '../config'

interface State {
    playingList: string[]
}

class PlayingList extends Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            playingList: []
        }

        this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this)
        this.onPlayingCloseButtonClick = this.onPlayingCloseButtonClick.bind(this)
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
                {this.state.playingList.map((val, index) => (
                    <>
                        <Row>
                            <Col span={20} style={{textAlign: 'left'}}>
                                <PlaySquareOutlined />
                                {val}
                            </Col>
                            <Col span={4}>
                                <Button type="primary" shape="circle" icon={<CloseOutlined />} onClick={this.onPlayingCloseButtonClick} id={'btn-'+index} danger />
                            </Col>
                        </Row>
                    </>
                ))}
            </>
        )
    }

    async onPlayingCloseButtonClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const btnId = e.currentTarget.id;
        const index = btnId.substring(4);
        const pid = this.state.playingList[Number(index)];

        console.log(pid);

        try {
            const response = await fetch(config.host + '/kill', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({pid: pid})
            })

            console.log(await response.text());

            // update the list after kill
            this.getPlayingList();
        }
        catch(error) {
            console.log(error);
        }
    }

    onRefreshButtonClick() {
        this.getPlayingList();
    }

    getPlayingList = async() =>{
        try {
            const response = await fetch(config.host + '/ps');
            const result = await response.json();
            this.setState({playingList: result})
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default PlayingList;