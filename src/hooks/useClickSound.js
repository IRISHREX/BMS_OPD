import useSound from 'use-sound';

const useClickSound = () => {
    const [play] = useSound('/click.mp3');

    const setupClickSound = (element) => {
        if (!element) return;

        const handler = () => {
            play();
        };
        
        element.addEventListener('click', handler);

        return () => {
            element.removeEventListener('click', handler);
        };
    };

    return setupClickSound;
};

export default useClickSound;
