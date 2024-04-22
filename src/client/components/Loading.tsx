import { Box, StatusIndicator } from "@cloudscape-design/components";

export const Loading = () => {
    return <div>
        <Box textAlign="center" padding={"xl"}>
            <StatusIndicator type="loading">Loading...</StatusIndicator>
        </Box>
    </div>;
}