declare module "@minikit/ui" {
  import * as React from "react";

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline" | "secondary" | "ghost";
    children: React.ReactNode;
    onClick?: () => void;
  }

  export const Button: React.FC<ButtonProps>;
}