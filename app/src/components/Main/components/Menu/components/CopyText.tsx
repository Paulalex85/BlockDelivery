import React, {useState} from 'react';
import {IoMdCopy, IoMdCheckmark} from "react-icons/io";
import CopyToClipboard from 'react-copy-to-clipboard';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

type CopyTextProps = {
    value: string;
}

const CopyText = ({value}: CopyTextProps) => {

    const [copied, setCopied] = useState(false);
    let size = 25;
    let tooltipText;

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    let logo;
    if (copied) {
        tooltipText = "Copied";
        logo = <IoMdCheckmark size={size}/>;
    } else {
        tooltipText = "Copy";
        logo = <IoMdCopy size={size}/>;
    }

    return (
        <OverlayTrigger
            placement={"bottom"}
            overlay={
                <Tooltip id={"copyTooltip"}>
                    {tooltipText}
                </Tooltip>
            }>
            <CopyToClipboard text={value} onCopy={() => handleCopy()}>
                <span>
                    {logo}
                </span>
            </CopyToClipboard>
        </OverlayTrigger>
    )
};

export default CopyText;