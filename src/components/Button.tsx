import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return <button type={type} className={`btn btn-${variant} btn-${size} ${className}`.trim()} {...rest} />;
}
