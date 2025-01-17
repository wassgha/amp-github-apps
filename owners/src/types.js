/**
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A logger interface.
 *
 * May be the console, a request context, or a shared logger.
 *
 * @typedef {{
 *   debug: function(*),
 *   log: function(*),
 *   warn: function(*),
 *   error: function(*),
 * }}
 */
let Logger;

/**
 * A map from filenames to the nearest ownership subtree.
 *
 * @typedef {!Object<string, !OwnersTree>}
 */
let FileTreeMap;

/**
 * A tuple of a reviewer username and the files they need to approve.
 *
 * @typedef {!Tuple<!string, string[]>}
 */
let ReviewerFiles;

/**
 * The result of parsing OWNERS files, along with any errors encountered.
 *
 * @template T
 * @typedef {{
 *   result: T,
 *   errors: OwnersParserError[],
 * }}
 */
let OwnersParserResult;

/**
 * A file ref from a commit.
 *
 * @typedef {!string}
 */
let FileRef;

/**
 * The result of an owners check.
 *
 * @typedef {{
 *   checkRun: CheckRun,
 *   reviewers: string[],
 * }}
 */
let OwnersCheckResult;

/**
 * A map from reviewer usernames to their approval status.
 *
 * @typedef {!Object<!string, boolean>}
 */
let ReviewerApprovalMap;

/**
 * A JSON owner definition.
 *
 * @typedef {{
 *   name: !string,
 *   requestReviews: ?boolean,
 *   notify: ?boolean,
 * }}
 */
let OwnerDefinition;

/**
 * A JSON owners rule definition.
 *
 * @typedef {{
 *   owners: OwnerDefinition[],
 *   pattern: ?string,
 * }}
 */
let RuleDefinition;

/**
 * A JSON owners file definition.
 *
 * @typedef {{
 *   rules: RuleDefinition[],
 * }}
 */
let OwnersFileDefinition;

module.exports = {
  FileTreeMap,
  Logger,
  ReviewerFiles,
  OwnersParserResult,
  FileRef,
  OwnersCheckResult,
  ReviewerApprovalMap,
  OwnerDefinition,
  RuleDefinition,
  OwnersFileDefinition,
};
