import React, { useEffect, useState } from 'react';
import { Button, Card, Divider, Form, Input, message, notification, TreeSelect } from 'antd';
import type {  FormProps, GetProp, TreeSelectProps } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import config from '../config';

type DefaultOptionType = GetProp<TreeSelectProps, 'treeData'>[number];

var gl_id_num = 1

interface DLComponentProps{
    dlName: string;
    dlUrl: string
}

interface FormValues {
    name: string;
    url: string;
    path: string;
}

interface DownloadingInfo{
    name: string;
    path: string;
    media: string;
    state: string;
    thread: string;
}

const DownloadWidget: React.FC<DLComponentProps> = (props) => {
    const [notificationApi, ncontextHolder] = notification.useNotification();
    const [value, setValue] = useState<string>();
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, 'label'>[]>([
        { id: 1, pId: 0, value: '/', title: '/' }
    ]);
    const [form] = Form.useForm<FormValues>();

    const [downloadingInfo, setDownloadingInfo] = useState<DownloadingInfo[]>([]);

    useEffect(() => {
        if (!props.dlName.endsWith('.mp4')) {
            form.setFieldsValue({name: props.dlName + '.mp4', url: props.dlUrl})
        }
        else {
            form.setFieldsValue({name: props.dlName, url: props.dlUrl})
        }

        const timer = setInterval(() => {
            onRefreshStateButtonClick();
        }, 2000);

        return () => {
            clearInterval(timer);
            console.log('Timer cleared');
        }
    })

    const onChange = (newValue: string) => {
        console.log('newvalue: '+newValue);
        setValue(newValue);
    };

    const loadData:TreeSelectProps['loadData'] = async (node) =>{
        let path = '/';
        if (node.value) {
            path = node.value.toString();
        }

            
        let rst = await getFilesName(path);
        let data = [];
        for (const item of rst) {
            if (item.type === 'folder') {
                gl_id_num++;
                data.push({id: gl_id_num, pId: node.id, value: item.path, title: item.name, isLeaf: false})
            }
        }
        setTreeData(treeData.concat(data));
    };

    const tranverseJson = (obj:any, rst: {name:string, path:string, type:string}[]) => {
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

    const getFilesName = async(folder:string) =>{
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
                tranverseJson(json['data'], rst);

                return rst
            }
            else {
                message.error(json['error'])
            }
        }
        catch (error) {
            message.error(<>Error happened when fetch {config.host}/ls: {error}</>)
        }
        return []
    }

    const onFinish: FormProps<FormValues>['onFinish'] = async (values) => {
        console.log('Success:', values);
        try {
            const response = await fetch(config.host + '/media_dl', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify(values)
            });
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Download failed: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    notificationApi.open({
                        type: 'success',
                        message: <>Download start</>,
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
                message: <>Error happened when fetch {config.host + '/media_dl'}: {e.message}</>,
                duration: 0
            })
        }
    };

    const onRefreshStateButtonClick = async () => {
        try {
            const response = await fetch(config.host + '/media_dl_info');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Get download info: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    console.log(json['data'])
                    setDownloadingInfo(json['data'])
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
                message: <>Error happened when fetch {config.host + '/media_dl_info'}: {e.message}</>,
                duration: 0
            })
        }
    }

    const onDeleteThreadButtonClick = async(thread:string) => {
        try {
            const response = await fetch(config.host + '/media_dl_delete', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify({'thread': thread})
            });
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] !== true) {
                    notificationApi.open({
                        type: 'warning',
                        message: <>Delete downloading thread error: {json['error']}</>,
                        duration: 0
                    })
                }
                else {
                    
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
                message: <>Error happened when fetch {config.host + '/media_dl_delete'}: {e.message}</>,
                duration: 0
            })
        }
    }

    return (
        <>
            {ncontextHolder}
            <Form
                name="download_info"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
                form={form}
            >
                <Form.Item label="Path" name="path" rules={[{required: true}]} >
                    <TreeSelect
                        treeDataSimpleMode
                        style={{ width: '100%' }}
                        value={value}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder="Please select"
                        onChange={onChange}
                        loadData={loadData}
                        treeData={treeData}
                    />
                </Form.Item>
                
                <Form.Item label="Name" name="name" rules={[{required: true}]} >
                    <Input id='DownloadWidget_name'/>
                </Form.Item>

                <Form.Item label="Url" name="url" rules={[{required: true}]} >
                    <Input id='DownloadWidget_url' />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Download
                    </Button>
                </Form.Item>
            </Form>
            <Divider />
            <div style={{textAlign:'right'}}>
                <Button icon={<ReloadOutlined /> } onClick={onRefreshStateButtonClick}></Button>
            </div>
            <div style={{textAlign: 'left'}}>
                {downloadingInfo.map((val, index) => (
                    <Card title={val.name} extra={<><Button icon={<DeleteOutlined />} onClick={() => onDeleteThreadButtonClick(val.thread)}></Button></>}>
                        <p><b>Path:</b> {val.path}</p>
                        <p><b>Url:</b> {val.media}</p>
                        <p><b>State:</b> {val.state}</p>
                        <p><b>Thread:</b> {val.thread}</p>
                    </Card>
                ))}
            </div>
        </>
    );
};

export default DownloadWidget;