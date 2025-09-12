import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * FileSystem API utilities demonstrating comprehensive file operations
 * Uses modern async/await patterns with Node.js FileSystem API
 */
export class FileSystemUtils {
    /**
     * Recursively read directory contents with detailed file information
     * @param {string} dirPath - Directory path to read
     * @param {Object} options - Options for reading
     * @returns {Promise<Array>} Array of file/directory objects
     */
    static async readDirectoryRecursive(dirPath, options = {}) {
        const { 
            includeFiles = true, 
            includeDirectories = true, 
            maxDepth = Infinity,
            filter = null,
            currentDepth = 0
        } = options;

        if (currentDepth >= maxDepth) {
            return [];
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const results = [];

            for (const entry of entries) {
                const fullPath = await import('path').then(path => path.join(dirPath, entry.name));
                
                // Apply filter if provided
                if (filter && !filter(entry.name, fullPath, entry)) {
                    continue;
                }

                if (entry.isDirectory() && includeDirectories) {
                    const stats = await this.getFileStats(fullPath);
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        type: 'directory',
                        stats,
                        depth: currentDepth
                    });

                    // Recursively read subdirectory
                    const subResults = await this.readDirectoryRecursive(fullPath, {
                        ...options,
                        currentDepth: currentDepth + 1
                    });
                    results.push(...subResults);
                } else if (entry.isFile() && includeFiles) {
                    const stats = await this.getFileStats(fullPath);
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        type: 'file',
                        stats,
                        depth: currentDepth
                    });
                }
            }

            return results;
        } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error.message);
            return [];
        }
    }

    /**
     * Get comprehensive file statistics
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} File statistics object
     */
    static async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                permissions: stats.mode.toString(8),
                sizeFormatted: this.formatFileSize(stats.size)
            };
        } catch (error) {
            return {
                error: error.message,
                size: 0,
                sizeFormatted: '0 B'
            };
        }
    }

    /**
     * Read file content with encoding detection and error handling
     * @param {string} filePath - Path to file
     * @param {string} encoding - File encoding (default: 'utf8')
     * @returns {Promise<string>} File content
     */
    static async readFileContent(filePath, encoding = 'utf8') {
        try {
            const content = await fs.readFile(filePath, encoding);
            return content;
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Write file content with directory creation if needed
     * @param {string} filePath - Path to file
     * @param {string} content - Content to write
     * @param {Object} options - Write options
     * @returns {Promise<void>}
     */
    static async writeFileContent(filePath, content, options = {}) {
        try {
            // Ensure directory exists
            const path = await import('path');
            const dir = path.dirname(filePath);
            await this.ensureDirectory(dir);

            await fs.writeFile(filePath, content, {
                encoding: 'utf8',
                ...options
            });
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Ensure directory exists, create if it doesn't (recursive)
     * @param {string} dirPath - Directory path
     * @returns {Promise<void>}
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
            }
        }
    }

    /**
     * Check if file or directory exists
     * @param {string} path - Path to check
     * @returns {Promise<boolean>} True if exists
     */
    static async exists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy file with progress tracking
     * @param {string} source - Source file path
     * @param {string} destination - Destination file path
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     */
    static async copyFile(source, destination, progressCallback = null) {
        try {
            // Ensure destination directory exists
            const path = await import('path');
            const destDir = path.dirname(destination);
            await this.ensureDirectory(destDir);

            if (progressCallback) {
                const stats = await this.getFileStats(source);
                let copiedBytes = 0;

                const sourceStream = createReadStream(source);
                const destStream = createWriteStream(destination);

                sourceStream.on('data', (chunk) => {
                    copiedBytes += chunk.length;
                    const progress = (copiedBytes / stats.size) * 100;
                    progressCallback(progress, copiedBytes, stats.size);
                });

                await pipeline(sourceStream, destStream);
            } else {
                await fs.copyFile(source, destination);
            }
        } catch (error) {
            throw new Error(`Failed to copy file from ${source} to ${destination}: ${error.message}`);
        }
    }

    /**
     * Delete file or directory recursively
     * @param {string} path - Path to delete
     * @returns {Promise<void>}
     */
    static async delete(path) {
        try {
            const stats = await fs.stat(path);
            if (stats.isDirectory()) {
                await fs.rmdir(path, { recursive: true });
            } else {
                await fs.unlink(path);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw new Error(`Failed to delete ${path}: ${error.message}`);
            }
        }
    }

    /**
     * Watch file or directory for changes
     * @param {string} path - Path to watch
     * @param {Function} callback - Callback for changes
     * @returns {Promise<Object>} Watcher object
     */
    static async watchPath(path, callback) {
        try {
            const watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
                callback(eventType, filename, path);
            });
            return watcher;
        } catch (error) {
            throw new Error(`Failed to watch ${path}: ${error.message}`);
        }
    }

    /**
     * Get directory tree structure
     * @param {string} rootPath - Root directory path
     * @param {number} maxDepth - Maximum depth to traverse
     * @returns {Promise<Object>} Tree structure object
     */
    static async getDirectoryTree(rootPath, maxDepth = 5) {
        const buildTree = async (dirPath, currentDepth = 0) => {
            if (currentDepth >= maxDepth) {
                return { name: 'MAX_DEPTH_REACHED', type: 'limit' };
            }

            try {
                const path = await import('path');
                const stats = await this.getFileStats(dirPath);
                const name = path.basename(dirPath);

                if (!stats.isDirectory) {
                    return {
                        name,
                        type: 'file',
                        size: stats.size,
                        path: dirPath
                    };
                }

                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const children = [];

                for (const entry of entries) {
                    const childPath = path.join(dirPath, entry.name);
                    const child = await buildTree(childPath, currentDepth + 1);
                    children.push(child);
                }

                return {
                    name,
                    type: 'directory',
                    path: dirPath,
                    children,
                    childCount: children.length
                };
            } catch (error) {
                return {
                    name: path.basename(dirPath),
                    type: 'error',
                    error: error.message,
                    path: dirPath
                };
            }
        };

        return await buildTree(rootPath);
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Find files matching pattern recursively
     * @param {string} rootPath - Root directory to search
     * @param {RegExp|string} pattern - Pattern to match
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Array of matching files
     */
    static async findFiles(rootPath, pattern, options = {}) {
        const { maxDepth = 10, includeContent = false } = options;
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const results = [];

        const searchRecursive = async (dirPath, currentDepth = 0) => {
            if (currentDepth >= maxDepth) return;

            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const path = await import('path');
                    const fullPath = path.join(dirPath, entry.name);

                    if (entry.isDirectory()) {
                        await searchRecursive(fullPath, currentDepth + 1);
                    } else if (entry.isFile() && regex.test(entry.name)) {
                        const stats = await this.getFileStats(fullPath);
                        const result = {
                            name: entry.name,
                            path: fullPath,
                            stats,
                            depth: currentDepth
                        };

                        if (includeContent) {
                            try {
                                result.content = await this.readFileContent(fullPath);
                            } catch (error) {
                                result.contentError = error.message;
                            }
                        }

                        results.push(result);
                    }
                }
            } catch (error) {
                console.error(`Error searching in ${dirPath}:`, error.message);
            }
        };

        await searchRecursive(rootPath);
        return results;
    }
}
