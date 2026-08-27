import useSound from 'use-sound';
import { useRef } from 'react';

const useClickSound = () => {
    const [play] = useSound('/click.mp3');
    const listenerMap = useRef(new WeakSet());

    const setupClickSound = (element) => {
        if (!element || listenerMap.current.has(element)) return;

        element.addEventListener('click', () => {
            play();
        });
        listenerMap.current.add(element);
    };

    return setupClickSound;
};

export default useClickSound;
