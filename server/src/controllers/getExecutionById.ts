import { Request, Response } from 'express';
import { Execution } from '../models';

export const getExecutionById = async (
  req: Request,
  res: Response
) => {

  const execution =
    await Execution.findById(req.params.id)
      .populate("pipelineId");

  res.json(execution);

};