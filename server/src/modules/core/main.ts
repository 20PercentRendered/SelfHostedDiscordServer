//required for tsc
import moduleConfig from './module.json'
function init(next: () => void) {
    
    next();
}

export {init};