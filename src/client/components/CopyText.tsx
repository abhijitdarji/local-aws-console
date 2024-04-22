import { useState } from 'react';
import { Box, Button, StatusIndicator, Popover, StatusIndicatorProps } from '@cloudscape-design/components';

const SUCCESS_STATUS = 'success';
const ERROR_STATUS = 'error';

export async function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

interface CopyTextProps {
  copyText: string;
  buttonText?: string;
  iconOnly?: boolean;
  noIcon?: boolean;
  copyButtonLabel?: string;
  successText?: string;
  errorText?: string;
}

export default function CopyText({ copyText, buttonText, iconOnly, noIcon = false, copyButtonLabel, successText, errorText }: CopyTextProps) {
  const [status, setStatus] = useState(SUCCESS_STATUS);
  const [message, setMessage] = useState(successText);

  return (
    <div style={{wordBreak: 'break-all'}}>
      <Box margin={{ right: 'xxs' }} display="inline-block">
        <Popover
          size="small"
          position="top"
          dismissButton={false}
          triggerType="custom"
          content={
            <StatusIndicator type={status as StatusIndicatorProps.Type}>{message}</StatusIndicator>
          }
        >
          <Button
            {...(iconOnly && { variant: 'inline-icon' }) }
            {...(!noIcon && { iconName:"copy" }) }
            ariaLabel={copyButtonLabel}
            onClick={() => {
              copyToClipboard(copyText).then(
                () => {
                  setStatus(SUCCESS_STATUS);
                  setMessage(successText);
                },
                () => {
                  setStatus(ERROR_STATUS);
                  setMessage(errorText);
                }
              );
            }}
          >
            {buttonText || copyText} 
          </Button>
        </Popover>
        { iconOnly && (buttonText || copyText)}
      </Box>
    </div>
  );
}