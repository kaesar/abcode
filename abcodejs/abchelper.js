// © 2021-2025 by César Andres Arcila Buitrago

const console = {
    messages: [],
    log: function(message) {
        this.messages.push("LOG: " + message);
    },
    info: function(message) {
        this.messages.push("INFO: " + message);
    },
    warn: function(message) {
        this.messages.push("WARN: " + message);
    },
    error: function(message) {
        this.messages.push("ERROR: " + message);
    }
}

function getConsole() {
    return console.messages.join('\n');
}

String.prototype.substr = function(start, length) {
    if (start < 0) {
        start = this.length + start;
        if (start < 0) start = 0;
    }
    if (length === undefined) {
        return this.substring(start);
    }
    if (length < 0) {
        return '';
    }
    return this.substring(start, start + length);
}
/*
// Implementación de Array.prototype.findIndex si no existe
if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        
        const list = Object(this);
        const length = list.length >>> 0;
        const thisArg = arguments[1];
        
        for (let i = 0; i < length; i++) {
            if (i in list && predicate.call(thisArg, list[i], i, list)) {
                return i;
            }
        }
        
        return -1;
    };
}

// Implementación de Array.prototype.find si no existe
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        
        const list = Object(this);
        const length = list.length >>> 0;
        const thisArg = arguments[1];
        
        for (let i = 0; i < length; i++) {
            if (i in list && predicate.call(thisArg, list[i], i, list)) {
                return list[i];
            }
        }
        
        return undefined;
    };
}

// Implementación de Array.prototype.splice si no existe o no funciona correctamente
if (!Array.prototype.splice || typeof Array.prototype.splice !== 'function') {
    Array.prototype.splice = function(start, deleteCount) {
        if (this == null) {
            throw new TypeError('Array.prototype.splice called on null or undefined');
        }
        
        const array = Object(this);
        const len = array.length >>> 0;
        
        // Convertir start a un entero
        start = parseInt(start, 10) || 0;
        if (start < 0) {
            start = Math.max(len + start, 0);
        } else {
            start = Math.min(start, len);
        }
        
        // Convertir deleteCount a un entero
        deleteCount = parseInt(deleteCount, 10) || 0;
        deleteCount = Math.max(0, Math.min(deleteCount, len - start));
        
        // Elementos a insertar
        const itemCount = arguments.length - 2;
        const removed = new Array(deleteCount);
        
        // Guardar elementos eliminados
        for (let i = 0; i < deleteCount; i++) {
            removed[i] = array[start + i];
        }
        
        // Calcular cuántos elementos quedarán después de la operación
        const newLen = len - deleteCount + itemCount;
        
        // Si hay más elementos a insertar que a eliminar, mover elementos existentes
        if (itemCount > deleteCount) {
            for (let i = len - 1; i >= start + deleteCount; i--) {
                array[i + (itemCount - deleteCount)] = array[i];
            }
        } 
        // Si hay menos elementos a insertar que a eliminar, mover elementos existentes
        else if (itemCount < deleteCount) {
            for (let i = start + deleteCount; i < len; i++) {
                array[i - (deleteCount - itemCount)] = array[i];
            }
            // Ajustar la longitud del array
            array.length = newLen;
        }
        
        // Insertar nuevos elementos
        for (let i = 0; i < itemCount; i++) {
            array[start + i] = arguments[i + 2];
        }
        
        return removed;
    };
}
*/