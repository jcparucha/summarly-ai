import { NextFunction, Request, Response } from "express";
import { SummarizeSchema } from "../schemas/ai.schema.js";
import { appMessages } from "../lang/app.js";

export function validateGeminiAPIKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: appMessages.error.required_gemini_key });
  }

  next();
}

export function validateInputs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = SummarizeSchema.safeParse(req.body);

  if (!result.success) {
    let errors: Record<string, string | any> = {};

    result.error.issues.forEach(({ path, message }) => {
      let currentError: Record<string, string | any> = errors;

      // check path if multiple path
      path.forEach((key, index) => {
        let k = key as string;

        // if the current path is the max, then pass the error message
        if (path.length - 1 === index) {
          currentError[k] = message;
        } else {
          // assign default value to currentError object
          currentError[k] = currentError[k] || {};
          // update currentError
          currentError = currentError[k];
        }
      });
    });

    return res.status(422).json(errors);
  }

  next();
}
