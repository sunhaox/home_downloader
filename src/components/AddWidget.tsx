import React, { useState } from 'react';
import { Button, Checkbox, Divider, Form, Input, message } from 'antd';
import type { CheckboxProps, FormProps } from 'antd';
import config from '../config';

const CheckboxGroup = Checkbox.Group;

var showInfo: {'name': string, 'url': string, 'list': any}| undefined = undefined;

const AddWidget: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [checkedList, setCheckedList] = useState<string[]>([]);
    const [plainOptions, setPlainOptins] = useState<string[]>([]);
    const [checkboxShow, setCheckboxShow] = useState<boolean>(false);

    const checkAll = plainOptions.length === checkedList.length;
    const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;

    const onChange = (list: string[]) => {
        setCheckedList(list);
    };

    const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
        setCheckedList(e.target.checked ? plainOptions : []);
    };

    const convertJsonToListInfo = (obj:any) => {
        if (!('name' in obj)) {
            return []
        }

        if (!('list' in obj)) {
            return []
        }

        var list:string[] = [];
        for (let key in obj['list']) {
            if (obj['list'].hasOwnProperty(key)) {
                list.push(key)
            }
        }

        return list;
    }

    const onFinish: FormProps<string>['onFinish'] = async (values) => {
        console.log('Success:', values);
        try {
            const response = await fetch(config.host + '/test_show_info', {
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

                var list = convertJsonToListInfo(json['data']);
                showInfo = json['data']
                setPlainOptins(list);

                setCheckboxShow(true);
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
                content: <>Error happened when fetch {config.host + '/test_show_info'}: {e.message}</>
            })
        }
    };

    const onSubmitButtonClick = async () => {
        if (showInfo === undefined) {
            messageApi.open({
                type: "error",
                content: 'Please test the info first'
            })
            return;
        }

        var data = JSON.parse(JSON.stringify(showInfo));
        data['list'] = {};
        for (let i in checkedList) {
            data['list'][checkedList[i]] = showInfo['list'][checkedList[i]];
        }

        try {
            const response = await fetch(config.host + '/submit_show_info', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify(showInfo)
            });
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] === true) {
                    messageApi.open({
                        type: 'success',
                        content: 'Submit successfully!'
                    })

                }
                else {
                    messageApi.open({
                        type: 'warning',
                        content: <>Submit failed: {json['error']}</>
                    })
                }
                // TODO Refresh?
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
                content: <>Error happened when fetch {config.host + '/delete_json'}: {e.message}</>
            })
        }
    }

    return (
        <>
            {contextHolder}
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item label="Name" name="name" rules={[{required: true}]} >
                    <Input id='AddWidget_name'/>
                </Form.Item>

                <Form.Item label="Url" name="url" rules={[{required: true}]} >
                    <Input id='AddWidget_url'/>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Test
                    </Button>
                </Form.Item>
            </Form>
            
            <Divider />
            <div style={{padding: '10px', display: checkboxShow? 'block': 'none'}}>
                <div>* Checked item will be skipped when downloading.</div>
                <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                    Check all
                </Checkbox>
                <br />
                <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} style={{textAlign: 'left', display: 'grid'}}/>
                <Button onClick={onSubmitButtonClick}>Submit</Button>
            </div>
        </>
    );
};

export default AddWidget;