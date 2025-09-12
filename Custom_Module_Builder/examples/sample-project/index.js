// Sample project entry point for testing the module builder
import { Calculator } from './src/calculator.js';
import { Logger } from './src/utils/logger.js';
import { Config } from './src/config.js';

const logger = new Logger('Main');
const config = new Config();
const calculator = new Calculator(config);

logger.info('Starting sample application...');

// Perform some calculations
const result1 = calculator.add(10, 5);
const result2 = calculator.multiply(result1, 2);
const result3 = calculator.divide(result2, 3);

logger.info(`Calculation results: ${result1}, ${result2}, ${result3}`);

export { calculator, logger, config };
