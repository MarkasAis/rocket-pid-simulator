const Input = (function() {
    const keys = {};

    function onKeyDown(event) {
        keys[event.key] = true;
    }

    function onKeyUp(event) {
        keys[event.key] = false;
    }

    function getKeyDown(key) {
        return !!keys[key];
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return {
        getKeyDown
    };
})();

export default Input;