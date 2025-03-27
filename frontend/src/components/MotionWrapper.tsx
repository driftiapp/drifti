import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type MotionWrapperProps = HTMLMotionProps<"div">;

export const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, ...props }) => {
    return (
        <motion.div {...props}>
            {children}
        </motion.div>
    );
}; 