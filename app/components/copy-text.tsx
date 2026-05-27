'use client';

import { Button, Popover, StatusIndicator } from '@cloudscape-design/components';
import { useState } from 'react';

type Props = {
  copyText: string;
  buttonText?: string;
  iconOnly?: boolean;
};

export function CopyText({ copyText, buttonText = 'Copy', iconOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Popover
      size="small"
      position="top"
      triggerType="custom"
      dismissButton={false}
      content={<StatusIndicator type="success">Copied</StatusIndicator>}
    >
      <Button iconName="copy" variant="inline-icon" onClick={handleCopy}>
        {!iconOnly && buttonText}
      </Button>
    </Popover>
  );
}
