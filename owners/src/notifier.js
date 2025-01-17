/**
 * Copyright 2019 The AMP HTML Authors.
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

const {OWNER_MODIFIER} = require('./owner');
const ADD_REVIEWERS_TAG = /#add-?owners/i;
const DONT_ADD_REVIEWERS_TAG = /#no-?add-?owners/i;

/**
 * Notifier for to tagging and requesting reviewers for a PR.
 */
class OwnersNotifier {
  /**
   * Constructor.
   *
   * @param {!PullRequest} pr pull request to add notifications to.
   * @param {!ReviewerApprovalMap} currentReviewers current reviewer approvals.
   * @param {!OwnersTree} tree file ownership tree.
   * @param {FileRef[]} changedFiles list of change files.
   */
  constructor(pr, currentReviewers, tree, changedFiles) {
    Object.assign(this, {pr, currentReviewers});
    this.fileTreeMap = tree.buildFileTreeMap(changedFiles);
  }

  /**
   * Notify reviewers and owners about the PR.
   *
   * @param {!GitHub} github GitHub API interface.
   * @param {string[]} suggestedReviewers suggested reviewers to add.
   */
  async notify(github, suggestedReviewers) {
    const requested = await this.requestReviews(github, suggestedReviewers);
    requested.forEach(reviewer => {
      this.currentReviewers[reviewer] = false;
    });

    await this.createNotificationComment(github);
  }

  /**
   * Requests reviews from owners.
   *
   * Only requests reviews if the PR description contains the #addowners tag.
   *
   * @param {!GitHub} github GitHub API interface.
   * @param {string[]} suggestedReviewers suggested reviewers to add.
   * @return {string[]} list of reviewers requested.
   */
  async requestReviews(github, suggestedReviewers) {
    const optOut = process.env.ADD_REVIEWERS_OPT_OUT;
    const optOutTagPresent = DONT_ADD_REVIEWERS_TAG.test(this.pr.description);
    const optInTagPresent = ADD_REVIEWERS_TAG.test(this.pr.description);

    if ((optOut && !optOutTagPresent) || (!optOut && optInTagPresent)) {
      const reviewRequests = this.getReviewersToRequest(suggestedReviewers);
      await github.createReviewRequests(this.pr.number, reviewRequests);
      return reviewRequests;
    }

    return [];
  }

  /**
   * Adds a comment tagging always-notify owners of changed files.
   *
   * @param {!GitHub} github GitHub API interface.
   */
  async createNotificationComment(github) {
    const [botComment] = await github.getBotComments(this.pr.number);
    const notifies = this.getOwnersToNotify();
    delete notifies[this.pr.author];

    const fileNotifyComments = Object.entries(notifies).map(
      ([name, filenames]) => {
        const header = `Hey @${name}, these files were changed:`;
        const files = filenames.map(filename => `- ${filename}`);
        return [header, ...files].join('\n');
      }
    );

    if (!fileNotifyComments.length) {
      return;
    }

    const comment = fileNotifyComments.join('\n\n');
    if (botComment) {
      await github.updateComment(botComment.id, comment);
    } else {
      await github.createBotComment(this.pr.number, comment);
    }
  }

  /**
   * Determine the set of users to request reviews from.
   *
   * @param {string[]} suggestedReviewers list of suggested reviewer usernames.
   * @return {string[]} list of usernames.
   */
  getReviewersToRequest(suggestedReviewers) {
    const reviewers = new Set(suggestedReviewers);
    Object.entries(this.fileTreeMap).forEach(([filename, subtree]) => {
      subtree
        .getModifiedFileOwners(filename, OWNER_MODIFIER.SILENT)
        .map(owner => owner.allUsernames)
        .reduce((left, right) => left.concat(right), [])
        .forEach(reviewers.delete, reviewers);
    });

    return Array.from(reviewers);
  }

  /**
   * Determine the set of owners to notify/tag for each file.
   *
   * @return {Object<string, string[]>} map from user/team names to filenames.
   */
  getOwnersToNotify() {
    const notifies = {};
    Object.entries(this.fileTreeMap).forEach(([filename, subtree]) => {
      subtree
        .getModifiedFileOwners(filename, OWNER_MODIFIER.NOTIFY)
        .map(owner => owner.name)
        .forEach(name => {
          if (!notifies[name]) {
            notifies[name] = [];
          }
          notifies[name].push(filename);
        });
    });

    Object.keys(this.currentReviewers).forEach(name => {
      delete notifies[name];
    });

    return notifies;
  }
}

module.exports = {OwnersNotifier};
