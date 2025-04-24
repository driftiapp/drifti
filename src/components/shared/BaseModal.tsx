import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    className
}) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={className}>
            {(title || description) && (
                <DialogHeader>
                    {title && <DialogTitle>{title}</DialogTitle>}
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
            )}
            {children}
        </DialogContent>
    </Dialog>
); 