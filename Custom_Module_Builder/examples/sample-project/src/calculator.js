// Calculator module with basic arithmetic operations
import { MathUtils } from './utils/mathUtils.js';
import { Validator } from './utils/validator.js';

export class Calculator {
    constructor(config) {
        this.config = config;
        this.validator = new Validator();
        this.precision = config.get('precision', 2);
    }

    add(a, b) {
        this.validator.validateNumbers(a, b);
        const result = MathUtils.add(a, b);
        return MathUtils.round(result, this.precision);
    }

    subtract(a, b) {
        this.validator.validateNumbers(a, b);
        const result = MathUtils.subtract(a, b);
        return MathUtils.round(result, this.precision);
    }

    multiply(a, b) {
        this.validator.validateNumbers(a, b);
        const result = MathUtils.multiply(a, b);
        return MathUtils.round(result, this.precision);
    }

    divide(a, b) {
        this.validator.validateNumbers(a, b);
        this.validator.validateNonZero(b);
        const result = MathUtils.divide(a, b);
        return MathUtils.round(result, this.precision);
    }

    power(base, exponent) {
        this.validator.validateNumbers(base, exponent);
        const result = MathUtils.power(base, exponent);
        return MathUtils.round(result, this.precision);
    }
}
