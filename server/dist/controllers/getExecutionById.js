"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutionById = void 0;
const models_1 = require("../models");
const getExecutionById = async (req, res) => {
    const execution = await models_1.Execution.findById(req.params.id)
        .populate("pipelineId");
    res.json(execution);
};
exports.getExecutionById = getExecutionById;
