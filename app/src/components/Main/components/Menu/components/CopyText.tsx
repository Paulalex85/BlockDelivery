import React, {useState} from 'react';
import {IoMdCopy, IoMdCheckmark} from "react-icons/io";
import CopyToClipboard from 'react-copy-to-clipboard';

type CopyTextProps = {
    value: string;
}

const CopyText = ({value}: CopyTextProps) => {

    const [copied, setCopied] = useState(false);
    let size = 25;

    let logo;
    if (copied) {
        logo = <IoMdCheckmark size={size} />;
    } else {
        logo = <IoMdCopy size={size}/>;
    }

    return (
        <CopyToClipboard text={value} onCopy={() => setCopied(true)}>
            {logo}
        </CopyToClipboard>
    )
};

export default CopyText;