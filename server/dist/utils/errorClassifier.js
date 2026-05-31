"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyError = void 0;
const classifyError = (logs) => {
    if (logs.includes("ECONNREFUSED")) {
        return {
            category: "Network Failure",
            solution: "Retry connection"
        };
    }
    if (logs.includes("npm ERR!")) {
        return {
            category: "Dependency Failure",
            solution: "Reinstall packages"
        };
    }
    if (logs.includes("Randomised test failed")) {
        return {
            category: "Flaky Test",
            solution: "Retry test"
        };
    }
    return {
        category: "Unknown",
        solution: "Manual investigation"
    };
};
exports.classifyError = classifyError;
