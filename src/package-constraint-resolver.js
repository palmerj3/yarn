/* @flow */

import type {Reporter} from './reporters/index.js';
import type Config from './config.js';

const semver = require('semver');

// This isn't really a "proper" constraint resolver. We just return the highest semver
// version in the versions passed that satisfies the input range. This vastly reduces
// the complexity and is very efficient for package resolution.

export default class PackageConstraintResolver {
  constructor(config: Config, reporter: Reporter) {
    this.reporter = reporter;
    this.config = config;
  }

  reporter: Reporter;
  config: Config;

  reduce(versions: Array<Array<string>>, range: string): Promise<?string> {
    if (this.config.getOption('module-quarantine-days') > 0) {
      // Filter package versions that are too new according to quarantine
      const now = (new Date()).getTime();
      const ONEDAY = 60 * 60 * 24 * 1000;

      // Resolve latest package within time range
      versions = versions
        .map((v) => [v[0], Date.parse(v[1])])
        .filter((v) => semver.satisfies(v[0], range, this.config.looseSemver))
        .filter((v) => (now - v[1]) >= this.config.getOption('module-quarantine-days') * ONEDAY)
    }

    // Strip out dates from versions array
    versions = versions
      .map((v) => v[0])

    if (range === 'latest') {
      // Usually versions are already ordered and the last one is the latest
      return Promise.resolve(versions[versions.length - 1]);
    } else {
      return Promise.resolve(semver.maxSatisfying(versions, range, this.config.looseSemver));
    }
  }
}
