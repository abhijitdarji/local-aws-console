import { ButtonProps, Button } from "@cloudscape-design/components";
import { useOnFollow } from "../hooks/use-on-follow";

export default function RouterButton(props: ButtonProps) {
  const onFollow = useOnFollow();

  return <Button {...props} onFollow={onFollow} />;
}
