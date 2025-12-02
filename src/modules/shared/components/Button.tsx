import type { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} style={{ padding: '8px 16px' }}>{props.children}</button>;
}
