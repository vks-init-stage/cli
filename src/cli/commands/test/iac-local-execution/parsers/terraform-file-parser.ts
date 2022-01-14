import hclToJson from './hcl-to-json';
import {
  EngineType,
  IaCErrorCodes,
  IacFileData,
  IacFileParsed,
} from '../types';
import { CustomError } from '../../../../../lib/errors';
import { getErrorStringCode } from '../error-utils';
import { IacProjectType } from '../../../../../lib/iac/constants';
const { parseModule } = require('../../../../../../release-scripts/hcl-to-json-parser-generator/src/hcltojson/dist/hcltojson');

export function tryParsingTerraformFile(
  fileData: IacFileData,
): Array<IacFileParsed> {
  try {
    // construct the input the branch needs to: {files: {}, flags: {}, env: {}
    // and send the current file
    const files = {};
    files[fileData.filePath] = fileData.fileContent;

    const moduleConfig = {
      files,
      // passing dummy data for now
      flags: {
        '-var': 'test1=value1',
      },
      env: [
        'name=value',
      ],
    };
    // get parsed JsonContent for each file, in one object
    // obviously this affects performance as we call the parser for each file - but this is just a poc :)
    const parsedOutputWithVars = parseModule(moduleConfig);
    // map the jsonContent
    return [
      {
        ...fileData,
        jsonContent: JSON.parse(parsedOutputWithVars),
        projectType: IacProjectType.TERRAFORM,
        engineType: EngineType.Terraform,
      },
    ];
  } catch (err) {
    throw new FailedToParseTerraformFileError(fileData.filePath);
  }
}

export class FailedToParseTerraformFileError extends CustomError {
  constructor(filename: string) {
    super('Failed to parse Terraform file');
    this.code = IaCErrorCodes.FailedToParseTerraformFileError;
    this.strCode = getErrorStringCode(this.code);
    this.userMessage = `We were unable to parse the Terraform file "${filename}", please ensure it is valid HCL2. This can be done by running it through the 'terraform validate' command.`;
  }
}
