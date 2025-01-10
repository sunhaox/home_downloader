import React, { ChangeEvent, useState } from 'react';
import config from '../config';
import TextArea from 'antd/es/input/TextArea';
import { Button, message } from 'antd';

const Settings: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [settingsContent, setSettingsContent] = useState<string>('null');
    
    const onGetButtonClick = async () => {
        try {
            const response = await fetch(config.host + '/settings_get');
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] === true) {
                    setSettingsContent(JSON.stringify(json['data'], null, 4))
                }
                else {
                    messageApi.open({
                        type: 'warning',
                        content: <>Submit failed: {json['error']}</>
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
                content: <>Error happened when fetch {config.host + '/settings_get'}: {e.message}</>
            })
        }
    }

    const onSubmitButtonClick = async () => {
        console.log(settingsContent)
        try {
            const response = await fetch(config.host + '/settings_set', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: settingsContent
            });
            const result = await response.text();
            try{
                const json = JSON.parse(result);
                if (json['rst'] === true) {
                    messageApi.open({
                        type: 'success',
                        content: <>Submit successfully</>
                    })
                }
                else {
                    messageApi.open({
                        type: 'warning',
                        content: <>Submit failed: {json['error']}</>
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
                content: <>Error happened when fetch {config.host + '/settings_set'}: {e.message}</>
            })
        }
    }

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setSettingsContent(e.target.value);
    };

    return (
        <>
            {contextHolder}
            <TextArea value={settingsContent} onChange={handleChange} autoSize />
            <Button onClick={onGetButtonClick} style={{marginRight: '10px'}}>Get</Button>
            <Button type="primary" onClick={onSubmitButtonClick}>Submit</Button>
        </>
    )
}

export default Settings;