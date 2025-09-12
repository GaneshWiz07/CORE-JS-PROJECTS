import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Path API utilities demonstrating cross-platform path handling
 * Provides comprehensive path manipulation and resolution capabilities
 */
export class PathUtils {
    /**
     * Normalize path for cross-platform compatibility
     * @param {string} inputPath - Input path to normalize
     * @returns {string} Normalized path
     */
    static normalize(inputPath) {
        return path.normalize(inputPath);
    }

    /**
     * Join multiple path segments safely
     * @param {...string} segments - Path segments to join
     * @returns {string} Joined path
     */
    static join(...segments) {
        return path.join(...segments);
    }

    /**
     * Resolve absolute path from relative path
     * @param {...string} pathSegments - Path segments to resolve
     * @returns {string} Absolute path
     */
    static resolve(...pathSegments) {
        return path.resolve(...pathSegments);
    }

    /**
     * Get relative path between two paths
     * @param {string} from - From path
     * @param {string} to - To path
     * @returns {string} Relative path
     */
    static relative(from, to) {
        return path.relative(from, to);
    }

    /**
     * Parse path into components
     * @param {string} filePath - Path to parse
     * @returns {Object} Path components object
     */
    static parse(filePath) {
        const parsed = path.parse(filePath);
        return {
            root: parsed.root,
            dir: parsed.dir,
            base: parsed.base,
            name: parsed.name,
            ext: parsed.ext,
            isAbsolute: path.isAbsolute(filePath),
            separator: path.sep,
            delimiter: path.delimiter
        };
    }

    /**
     * Format path from components
     * @param {Object} pathObject - Path components
     * @returns {string} Formatted path
     */
    static format(pathObject) {
        return path.format(pathObject);
    }

    /**
     * Get directory name from path
     * @param {string} filePath - File path
     * @returns {string} Directory name
     */
    static dirname(filePath) {
        return path.dirname(filePath);
    }

    /**
     * Get base name from path
     * @param {string} filePath - File path
     * @param {string} ext - Extension to remove
     * @returns {string} Base name
     */
    static basename(filePath, ext) {
        return path.basename(filePath, ext);
    }

    /**
     * Get file extension from path
     * @param {string} filePath - File path
     * @returns {string} File extension
     */
    static extname(filePath) {
        return path.extname(filePath);
    }

    /**
     * Check if path is absolute
     * @param {string} inputPath - Path to check
     * @returns {boolean} True if absolute
     */
    static isAbsolute(inputPath) {
        return path.isAbsolute(inputPath);
    }

    /**
     * Convert file URL to path (for ES modules)
     * @param {string} url - File URL
     * @returns {string} File path
     */
    static fromFileURL(url) {
        return fileURLToPath(url);
    }

    /**
     * Get current working directory
     * @returns {string} Current working directory
     */
    static getCurrentDirectory() {
        return process.cwd();
    }

    /**
     * Get __dirname equivalent for ES modules
     * @param {string} importMetaUrl - import.meta.url
     * @returns {string} Directory name
     */
    static getDirname(importMetaUrl) {
        return path.dirname(fileURLToPath(importMetaUrl));
    }

    /**
     * Convert Windows path to POSIX path
     * @param {string} windowsPath - Windows path
     * @returns {string} POSIX path
     */
    static toPosix(windowsPath) {
        return windowsPath.split(path.sep).join(path.posix.sep);
    }

    /**
     * Convert POSIX path to Windows path
     * @param {string} posixPath - POSIX path
     * @returns {string} Windows path
     */
    static toWindows(posixPath) {
        return posixPath.split(path.posix.sep).join(path.win32.sep);
    }

    /**
     * Ensure path uses forward slashes (for URLs/imports)
     * @param {string} inputPath - Input path
     * @returns {string} Path with forward slashes
     */
    static toForwardSlashes(inputPath) {
        return inputPath.replace(/\\/g, '/');
    }

    /**
     * Ensure path uses backslashes (for Windows)
     * @param {string} inputPath - Input path
     * @returns {string} Path with backslashes
     */
    static toBackSlashes(inputPath) {
        return inputPath.replace(/\//g, '\\');
    }

    /**
     * Get common base path from multiple paths
     * @param {Array<string>} paths - Array of paths
     * @returns {string} Common base path
     */
    static getCommonBasePath(paths) {
        if (!paths || paths.length === 0) return '';
        if (paths.length === 1) return path.dirname(paths[0]);

        const normalizedPaths = paths.map(p => this.normalize(p));
        const segments = normalizedPaths.map(p => p.split(path.sep));
        
        let commonSegments = [];
        const minLength = Math.min(...segments.map(s => s.length));

        for (let i = 0; i < minLength; i++) {
            const segment = segments[0][i];
            if (segments.every(s => s[i] === segment)) {
                commonSegments.push(segment);
            } else {
                break;
            }
        }

        return commonSegments.join(path.sep) || path.sep;
    }

    /**
     * Check if path is within another path (security check)
     * @param {string} childPath - Child path to check
     * @param {string} parentPath - Parent path
     * @returns {boolean} True if child is within parent
     */
    static isWithinPath(childPath, parentPath) {
        const resolvedChild = this.resolve(childPath);
        const resolvedParent = this.resolve(parentPath);
        const relativePath = this.relative(resolvedParent, resolvedChild);
        
        return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    }

    /**
     * Generate unique file path by adding suffix if file exists
     * @param {string} basePath - Base file path
     * @param {Function} existsCheck - Function to check if path exists
     * @returns {Promise<string>} Unique file path
     */
    static async generateUniquePath(basePath, existsCheck) {
        let counter = 0;
        let uniquePath = basePath;
        
        while (await existsCheck(uniquePath)) {
            counter++;
            const parsed = this.parse(basePath);
            uniquePath = this.join(
                parsed.dir,
                `${parsed.name}_${counter}${parsed.ext}`
            );
        }
        
        return uniquePath;
    }

    /**
     * Convert module path to file system path
     * @param {string} modulePath - Module import path
     * @param {string} basePath - Base directory path
     * @returns {string} File system path
     */
    static moduleToFilePath(modulePath, basePath) {
        // Handle relative imports
        if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
            return this.resolve(basePath, modulePath);
        }
        
        // Handle absolute imports (node_modules)
        if (!modulePath.startsWith('/')) {
            return this.resolve(basePath, 'node_modules', modulePath);
        }
        
        return this.resolve(modulePath);
    }

    /**
     * Convert file system path to module import path
     * @param {string} filePath - File system path
     * @param {string} basePath - Base directory path
     * @returns {string} Module import path
     */
    static fileToModulePath(filePath, basePath) {
        const relativePath = this.relative(basePath, filePath);
        
        // Convert to forward slashes for imports
        const importPath = this.toForwardSlashes(relativePath);
        
        // Add ./ prefix for relative imports
        if (!importPath.startsWith('../')) {
            return `./${importPath}`;
        }
        
        return importPath;
    }

    /**
     * Resolve import path with extensions
     * @param {string} importPath - Import path
     * @param {string} basePath - Base directory
     * @param {Array<string>} extensions - Extensions to try
     * @returns {Object} Resolution result
     */
    static resolveImport(importPath, basePath, extensions = ['.js', '.mjs', '.json']) {
        const resolvedBase = this.resolve(basePath, importPath);
        
        // Try exact path first
        const candidates = [resolvedBase];
        
        // Try with extensions
        for (const ext of extensions) {
            if (!resolvedBase.endsWith(ext)) {
                candidates.push(resolvedBase + ext);
            }
        }
        
        // Try index files
        for (const ext of extensions) {
            candidates.push(this.join(resolvedBase, `index${ext}`));
        }
        
        return {
            originalPath: importPath,
            basePath,
            candidates,
            resolved: candidates[0] // First candidate as default
        };
    }

    /**
     * Get path depth (number of directory levels)
     * @param {string} inputPath - Path to analyze
     * @returns {number} Path depth
     */
    static getDepth(inputPath) {
        const normalized = this.normalize(inputPath);
        const segments = normalized.split(path.sep).filter(segment => segment !== '');
        return segments.length;
    }

    /**
     * Create path matcher function
     * @param {string|RegExp} pattern - Pattern to match
     * @returns {Function} Matcher function
     */
    static createMatcher(pattern) {
        if (pattern instanceof RegExp) {
            return (filePath) => pattern.test(filePath);
        }
        
        // Convert glob-like pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
            
        const regex = new RegExp(`^${regexPattern}$`);
        return (filePath) => regex.test(filePath);
    }

    /**
     * Get platform-specific path information
     * @returns {Object} Platform path information
     */
    static getPlatformInfo() {
        return {
            separator: path.sep,
            delimiter: path.delimiter,
            platform: process.platform,
            isWindows: process.platform === 'win32',
            isPosix: process.platform !== 'win32',
            maxPathLength: process.platform === 'win32' ? 260 : 4096
        };
    }

    /**
     * Sanitize path for safe file system operations
     * @param {string} inputPath - Path to sanitize
     * @returns {string} Sanitized path
     */
    static sanitize(inputPath) {
        // Remove dangerous characters
        const dangerous = /[<>:"|?*\x00-\x1f]/g;
        const sanitized = inputPath.replace(dangerous, '_');
        
        // Handle reserved names on Windows
        const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        const segments = sanitized.split(path.sep).map(segment => {
            if (reserved.test(segment)) {
                return `_${segment}`;
            }
            return segment;
        });
        
        return segments.join(path.sep);
    }
}
