import React from 'react';
import config from '../config';

const AboutWidget: React.FC = () => {
    return (
        <>
            <h2>Home Downloader</h2>
            <p><b>GitHub:</b> <a href='https://github.com/sunhx/home_downloader'>https://github.com/sunhx/home_downloader</a></p>
            <p><b>Auth:</b> <a href='mailto:oliver@sunhx.cn'>oliver@sunhx.cn</a></p>
            <p><b>Version:</b> {config.version}</p>
        </>
    )
}

export default AboutWidget;