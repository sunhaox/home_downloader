import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import type {  FormProps } from 'antd';
import config from '../config';

const DownloadWidget: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish: FormProps<string>['onFinish'] = async (values) => {
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
                    messageApi.open({
                        type: 'warning',
                        content: <>Test failed: {json['error']}</>
                    })
                }

                
            }
            catch(error) {
                const e = error as Error;
                messageApi.open({
                    type: 'error',
                    content: <>Error happened when processing data: {e.message}</>
                })
            }
        }
        catch (error) {
            const e = error as Error;
            messageApi.open({
                type: 'error',
                content: <>Error happened when fetch {config.host + '/media_dl'}: {e.message}</>
            })
        }
    };

    return (
        <>
            {contextHolder}
            <Form
                name="download_info"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item label="Name" name="name" rules={[{required: true}]} >
                    <Input id='DownloadWidget_name'/>
                </Form.Item>

                <Form.Item label="Url" name="url" rules={[{required: true}]} >
                    <Input id='DownloadWidget_url'/>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Test
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};

export default DownloadWidget;