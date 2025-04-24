import React from 'react';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
    id: string;
    label: string;
}

interface CheckboxGroupProps {
    label: string;
    options: CheckboxOption[];
    value: Record<string, boolean>;
    onChange: (id: string, checked: boolean) => void;
    className?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    label,
    options,
    value,
    onChange,
    className
}) => (
    <div className={`space-y-4 ${className || ''}`}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</h4>
        <div className="space-y-3">
            {options.map(option => (
                <div key={option.id} className="flex items-center">
                    <input
                        type="checkbox"
                        id={option.id}
                        checked={value[option.id]}
                        onChange={(e) => onChange(option.id, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        aria-label={option.label}
                    />
                    <Label htmlFor={option.id} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                    </Label>
                </div>
            ))}
        </div>
    </div>
); 