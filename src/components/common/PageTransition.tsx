import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
                duration: 0.45,
                ease: [0.4, 0, 0.2, 1],
            }}
            style={{ width: "100%", height: "100%" }}
        >
            {children}
        </motion.div>
    );
}
