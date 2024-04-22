
import DotNetIcon from "../assets/dotnet.svg?react";
import JavaIcon from "../assets/java.svg?react";
import NodejsIcon from "../assets/nodejs.svg?react";
import PythonIcon from "../assets/python.svg?react";
import RubyIcon from "../assets/ruby.svg?react";
import GoIcon from "../assets/go.svg?react";
import * as awsui from '@cloudscape-design/design-tokens';

type LambdaRuntimeIconProps = {
    runtime: string;
}

export const LambdaRuntimeIcon = ({ runtime }: LambdaRuntimeIconProps) => {
    let RuntimeIcon;
    const runtimeLower = runtime.toLowerCase();
    if (runtimeLower.startsWith("dotnet")) RuntimeIcon = DotNetIcon;
    else if (runtimeLower.startsWith("java")) RuntimeIcon = JavaIcon;
    else if (runtimeLower.startsWith("node")) RuntimeIcon = NodejsIcon;
    else if (runtimeLower.startsWith("python")) RuntimeIcon = PythonIcon;
    else if (runtimeLower.startsWith("ruby")) RuntimeIcon = RubyIcon;
    else if (runtimeLower.startsWith("go")) RuntimeIcon = GoIcon;
    else RuntimeIcon = null;

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            {RuntimeIcon && <RuntimeIcon height={32} width={32} style={{ marginRight: "8px" }} />}
            <div style={{ flexGrow: 1 }}>{runtime}</div>
        </div>
    );
}