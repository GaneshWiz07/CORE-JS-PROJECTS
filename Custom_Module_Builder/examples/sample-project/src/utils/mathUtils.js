// Mathematical utility functions
export class MathUtils {
    static add(a, b) {
        return a + b;
    }

    static subtract(a, b) {
        return a - b;
    }

    static multiply(a, b) {
        return a * b;
    }

    static divide(a, b) {
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        return a / b;
    }

    static power(base, exponent) {
        return Math.pow(base, exponent);
    }

    static round(number, precision = 2) {
        const factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }

    static sqrt(number) {
        if (number < 0) {
            throw new Error('Square root of negative number is not allowed');
        }
        return Math.sqrt(number);
    }

    static abs(number) {
        return Math.abs(number);
    }

    static max(...numbers) {
        return Math.max(...numbers);
    }

    static min(...numbers) {
        return Math.min(...numbers);
    }
}
