import React, { Component } from 'react';
import './PlayingList.css';
import { Button, Divider, Tooltip } from 'antd';
import { ReloadOutlined, PlaySquareOutlined, CloseOutlined } from '@ant-design/icons';

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
                    <div className='FilesList'>
                        <div className='FilesList-left'>
                            <PlaySquareOutlined />
                            {val}
                        </div>
                        <div className='FilesList-right'>
                            <Button type="primary" shape="circle" icon={<CloseOutlined />} onClick={this.onPlayingCloseButtonClick} id={'btn-'+index} danger />
                        </div>
                    </div>
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
            const response = await fetch('http://localhost:8088/kill', {
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
            const response = await fetch('http://localhost:8088/ps');
            const result = await response.json();
            this.setState({playingList: result})
        }
        catch (error) {
            console.log(error);
        }
    }
}

export default PlayingList;