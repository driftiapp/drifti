import React from 'react';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
    label: string;
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, id, children, className }) => (
    <div className={`space-y-2 ${className || ''}`}>
        <Label htmlFor={id}>{label}</Label>
        {children}
    </div>
); 