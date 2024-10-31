import React, { useState } from 'react';
import { Button, Collapse, message, notification, Popconfirm } from 'antd';
import { CoffeeOutlined, CopyOutlined, DeleteOutlined, FileSyncOutlined, FormOutlined, ReloadOutlined } from '@ant-design/icons';
import type {CollapseProps, PopconfirmProps} from 'antd';
import config from '../config'

interface ComponentProps {
    updateDownloadInfo: (name:string, url:string) => void
}

const WatchList: React.FC<ComponentProps> = (props) => {
    const [notificationApi, ncontextHolder] = notification.useNotification();
    const [showInfo, setShowInfo] = useState<CollapseProps['items']>([]);

    const onChange = (key: string | string[]) => {
        console.log(key);
    };

    const onDeleteConfirmClick: PopconfirmProps['onConfirm'] = async (e) => {
        if (!e) {
            return
        }

        const btnId = e.currentTarget.id;
        const name = btnId.substring(4);
        console.log(name);
        message.success('Click on Yes');

        try {
            const response = await fetch(config.host + '/delete_json', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({name: name})
            });
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] === true) {
                    notificationApi.open({
                        type: 'success',
                        message: 'Delete successfully!',
                        duration: 0
                    })

                }
                else {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Delete failed: {json['error']}</>,
                        duration: 0
                    })
                }

                onRefreshButtonClick();
            }
            catch(error) {
                const e = error as Error;
                notificationApi.open({
                    type: 'error',
                    message: <>Error happened when processing data: {e.message}</>,
                    duration: 0
                })
            }
        }
        catch (error) {
            const e = error as Error;
            notificationApi.open({
                type: 'error',
                message: <>Error happened when fetch {config.host + '/delete_json'}: {e.message}</>,
                duration: 0
            })
        }
    };

    const convertJsonToSeasonInfo = (obj:any) => {
        if (!('name' in obj)) {
            return undefined
        }

        if (!('list' in obj)) {
            return undefined
        }

        var list:string[] = [];
        for (let key in obj['list']) {
            if (obj['list'].hasOwnProperty(key)) {
                list.push(key)
            }
        }

        return {
            key: obj['name'],
            label: obj['name'],
            children: <><ul>{list.map((val, index) => 
                <li key={val}>
                    <FormOutlined onClick={() => {
                        // TODO maybe need to check the filed
                        props.updateDownloadInfo(obj['list'][val]['title'], obj['list'][val]['media']);
                    }} />
                    {val}
                </li>
            )}</ul></>,
            extra: <>
            <Button icon={<FileSyncOutlined></FileSyncOutlined>} onClick={async (event) => {
                try {
                    const response = await fetch(config.host + '/sync_season', {
                        method: 'POST',
                        headers: new Headers({'Content-Type': 'application/json'}),
                        body: JSON.stringify({name: obj['name']})
                    });
                    const result = await response.text();
                    try{
                        const json = JSON.parse(result);
                        if (json['rst'] !== true) {
                            notificationApi.open({
                                type: 'warning',
                                message: <>Sync failed: {json['error']}</>,
                                duration: 0
                            })
                        }
                        else {
                            notificationApi.open({
                                type: 'info',
                                message: "Sync may take a long time, please wait.",
                                duration: 0
                            })
                        }
        
                    }
                    catch(error) {
                        const e = error as Error;
                        notificationApi.open({
                            type: 'error',
                            message: <>Error happened when sync data: {e.message}</>,
                            duration: 0
                        })
                    }
                }
                catch (error) {
                    const e = error as Error;
                    notificationApi.open({
                        type: 'error',
                        message: <>Error happened when fetch {config.host + '/sync_season'}: {e.message}</>,
                        duration: 0
                    })
                }
                event.stopPropagation();
            }}/>
            <Button icon={<CopyOutlined />} onClick={(event) => {
                navigator.clipboard.writeText(obj['url'])
                notificationApi.open({
                    type: 'info',
                    message: 'web url copied to the clipboard.',
                    duration: 0
                })
                event.stopPropagation();
            }}
            />
            <Popconfirm
                title="Delete the file"
                description="Are you sure to delete this file?"
                onConfirm={onDeleteConfirmClick}
                okText="Yes"
                cancelText="No"
                okButtonProps={{id: 'del-'+obj['name']}}
            >
                <Button icon={<DeleteOutlined />} onClick={(event) => {
                        event.stopPropagation();
                    }}
                />
            </Popconfirm>
            </>,
        }
    }
    
    const onSyncButtonClick = async() => {
        try {
            const response = await fetch(config.host + '/sync');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Referesh failed: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    notificationApi.open({
                        type: 'info',
                        message: "Sync may take a long time, please wait.",
                        duration: 0
                    })
                }

            }
            catch(error) {
                const e = error as Error;
                notificationApi.open({
                    type: 'error',
                    message: <>Error happened when processing data: {e.message}</>,
                    duration: 0
                })
            }
        }
        catch (error) {
            const e = error as Error;
            notificationApi.open({
                type: 'error',
                message: <>Error happened when fetch {config.host + '/sync'}: {e.message}</>,
                duration: 0
            })
        }
    }

    const onSyncTestButtonClick = async() => {
        try {
            const response = await fetch(config.host + '/sync_test');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Sync test failed: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    notificationApi.open({
                        type: 'info',
                        message: "No sync thread running",
                        duration: 0
                    })
                }

            }
            catch(error) {
                const e = error as Error;
                notificationApi.open({
                    type: 'error',
                    message: <>Error happened when processing data: {e.message}</>,
                    duration: 0
                })
            }
        }
        catch (error) {
            const e = error as Error;
            notificationApi.open({
                type: 'error',
                message: <>Error happened when fetch {config.host + '/sync_test'}: {e.message}</>,
                duration: 0
            })
        }
    }

    const onRefreshButtonClick = async () => {
        try {
            const response = await fetch(config.host + '/read_json');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                var rst:CollapseProps['items'] = [];
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Referesh failed: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    for(const element of json['data']) {
                        var item = convertJsonToSeasonInfo(element)
                        if (item) {
                            rst.push(item)
                        }
                    }
                    setShowInfo(rst)
                }

            }
            catch(error) {
                const e = error as Error;
                notificationApi.open({
                    type: 'error',
                    message: <>Error happened when processing data: {e.message}</>,
                    duration: 0
                })
            }
        }
        catch (error) {
            const e = error as Error;
            notificationApi.open({
                type: 'error',
                message: <>Error happened when fetch {config.host + '/read_json'}: {e.message}</>,
                duration: 0
            })
        }
    }

    return (
        <>
                    {ncontextHolder}
                    <Button type="primary" icon={<ReloadOutlined />} onClick={onRefreshButtonClick} >Reload</Button>
                    <Button type="primary" icon={<FileSyncOutlined />} onClick={onSyncButtonClick} style={{marginLeft: '10px'}}>Sync</Button>
                    <Button type="primary" icon={<CoffeeOutlined />} onClick={onSyncTestButtonClick} style={{marginLeft: '10px'}}>Test</Button>
                    <Collapse
                        defaultActiveKey={['1']}
                        onChange={onChange}
                        expandIconPosition={'start'}
                        items={showInfo}
                        style={{textAlign:"left"}}
                    />
                </>
    );
};

export default WatchList;