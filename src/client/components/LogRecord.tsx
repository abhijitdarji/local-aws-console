import { useEffect, useState } from "react";
import { useCachedData } from "../hooks/use-cached-data";
import { LoadingErrorEmptyHandler } from "./LoadingErrorEmptyHandler";

interface LogRecordProps {
    ptr: string;
}

export const LogRecord = (props: LogRecordProps) => {

    const [logRecord, setLogRecord] = useState<any>(null);
    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/CloudWatchLogs/GetLogRecord',
        body: {
            logRecordPointer: props.ptr
        },
        forceFetch: 0
    });

    useEffect(() => {
        if (data?.logRecord)
            setLogRecord(data.logRecord);
    }, [data]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={Object.keys(logRecord || {})?.length}>
                
            <table>
                <thead>
                    <tr>
                        <th style={{
                            textAlign: 'left',
                            width: '140px'
                        }}>Field</th>
                        <th style={{
                            textAlign: 'left'
                        }}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(logRecord || {}).map((key, index) => {
                        return <tr key={index}>
                            <td>{key}</td>
                            <td>{logRecord[key]}</td>
                        </tr>
                    })}
                </tbody>

            </table>

        </LoadingErrorEmptyHandler>

    </>

}