// Validation utility functions
export class Validator {
    validateNumbers(...numbers) {
        for (const num of numbers) {
            if (typeof num !== 'number' || isNaN(num)) {
                throw new Error(`Invalid number: ${num}`);
            }
        }
    }

    validateNonZero(number) {
        if (number === 0) {
            throw new Error('Number cannot be zero');
        }
    }

    validatePositive(number) {
        if (number <= 0) {
            throw new Error('Number must be positive');
        }
    }

    validateInteger(number) {
        if (!Number.isInteger(number)) {
            throw new Error('Number must be an integer');
        }
    }

    validateRange(number, min, max) {
        if (number < min || number > max) {
            throw new Error(`Number must be between ${min} and ${max}`);
        }
    }
}
