import { useRef } from 'react';
import { playClickSound } from '../utils/soundUtils';

const useClickSound = () => {
    const listenerMap = useRef(new WeakSet());

    const setupClickSound = (element) => {
        if (!element || typeof element.addEventListener !== 'function' || listenerMap.current.has(element)) return;

        element.addEventListener('click', () => {
            playClickSound();
        });
        listenerMap.current.add(element);
    };

    return setupClickSound;
};

export default useClickSound;
