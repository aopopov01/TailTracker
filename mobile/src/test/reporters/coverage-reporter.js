const fs = require('fs');
const path = require('path');

// Custom Jest Coverage Reporter for TailTracker
class TailTrackerCoverageReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.coverageThreshold = {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      critical: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    };
    
    this.criticalFiles = [
      'src/hooks/useLostPetNotifications',
      'src/services/NotificationService',
      'src/services/authService',
      'src/services/StripePaymentService',
      'src/contexts/AuthContext',
    ];
  }

  onRunComplete(contexts, results) {
    const { coverageMap } = results;
    
    if (!coverageMap) {
      console.log('No coverage data available');
      return;
    }

    try {
      // Generate detailed coverage report
      const coverageReport = this.generateDetailedReport(coverageMap);
      
      // Check coverage thresholds
      const thresholdResults = this.checkCoverageThresholds(coverageReport);
      
      // Generate HTML summary
      this.generateHtmlSummary(coverageReport, thresholdResults);
      
      // Generate markdown report for PR comments
      this.generateMarkdownReport(coverageReport, thresholdResults);
      
      // Generate badge data
      this.generateBadgeData(coverageReport);
      
      // Log results to console
      this.logCoverageResults(coverageReport, thresholdResults);
      
      // Fail if thresholds not met
      if (!thresholdResults.passed && this.options.failOnThreshold !== false) {
        console.error('❌ Coverage thresholds not met');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('Error generating coverage report:', error);
    }
  }

  generateDetailedReport(coverageMap) {
    const fileCoverageData = [];
    const summary = {
      lines: { total: 0, covered: 0, pct: 0 },
      statements: { total: 0, covered: 0, pct: 0 },
      functions: { total: 0, covered: 0, pct: 0 },
      branches: { total: 0, covered: 0, pct: 0 },
    };

    // Process each file in coverage map
    coverageMap.files().forEach(filename => {
      const fileCoverage = coverageMap.fileCoverageFor(filename);
      const fileSummary = fileCoverage.toSummary();
      
      // Skip test files and node_modules
      if (this.shouldIncludeFile(filename)) {
        const relativePath = path.relative(process.cwd(), filename);
        
        const fileData = {
          filename: relativePath,
          shortname: path.basename(filename),
          lines: fileSummary.lines,
          statements: fileSummary.statements,
          functions: fileSummary.functions,
          branches: fileSummary.branches,
          isCritical: this.isCriticalFile(relativePath),
          uncoveredLines: this.getUncoveredLines(fileCoverage),
          uncoveredFunctions: this.getUncoveredFunctions(fileCoverage),
        };

        fileCoverageData.push(fileData);
        
        // Accumulate totals
        ['lines', 'statements', 'functions', 'branches'].forEach(type => {
          summary[type].total += fileSummary[type].total;
          summary[type].covered += fileSummary[type].covered;
        });
      }
    });

    // Calculate percentages
    ['lines', 'statements', 'functions', 'branches'].forEach(type => {
      summary[type].pct = summary[type].total > 0 
        ? Math.round((summary[type].covered / summary[type].total) * 100 * 100) / 100
        : 100;
    });

    return {
      summary,
      files: fileCoverageData,
      timestamp: new Date().toISOString(),
      totalFiles: fileCoverageData.length,
    };
  }

  checkCoverageThresholds(coverageReport) {
    const results = {
      passed: true,
      failures: [],
      globalCheck: {},
      criticalCheck: {},
    };

    // Check global thresholds
    ['lines', 'statements', 'functions', 'branches'].forEach(type => {
      const actual = coverageReport.summary[type].pct;
      const threshold = this.coverageThreshold.global[type];
      const passed = actual >= threshold;
      
      results.globalCheck[type] = {
        actual,
        threshold,
        passed,
        difference: actual - threshold,
      };
      
      if (!passed) {
        results.passed = false;
        results.failures.push({
          type: 'global',
          metric: type,
          actual,
          threshold,
          difference: threshold - actual,
        });
      }
    });

    // Check critical file thresholds
    const criticalFiles = coverageReport.files.filter(f => f.isCritical);
    criticalFiles.forEach(file => {
      ['lines', 'statements', 'functions', 'branches'].forEach(type => {
        const actual = file[type].pct;
        const threshold = this.coverageThreshold.critical[type];
        const passed = actual >= threshold;
        
        if (!results.criticalCheck[file.filename]) {
          results.criticalCheck[file.filename] = {};
        }
        
        results.criticalCheck[file.filename][type] = {
          actual,
          threshold,
          passed,
          difference: actual - threshold,
        };
        
        if (!passed) {
          results.passed = false;
          results.failures.push({
            type: 'critical',
            file: file.filename,
            metric: type,
            actual,
            threshold,
            difference: threshold - actual,
          });
        }
      });
    });

    return results;
  }

  generateHtmlSummary(coverageReport, thresholdResults) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TailTracker Test Coverage Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #24292e; font-size: 32px; font-weight: 600; margin: 0; }
        .subtitle { color: #586069; font-size: 16px; margin: 10px 0 0 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: #f6f8fa; border: 1px solid #e1e5e9; border-radius: 6px; padding: 20px; text-align: center; }
        .metric-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #586069; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e5e9; }
        .table th { background: #f6f8fa; font-weight: 600; }
        .critical-badge { background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .progress-bar { width: 100%; height: 20px; background: #e1e5e9; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 10px; }
        .threshold-status { font-weight: bold; padding: 4px 8px; border-radius: 4px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🐾 TailTracker Test Coverage Report</h1>
            <p class="subtitle">Generated on ${new Date(coverageReport.timestamp).toLocaleString()}</p>
            <p class="subtitle">Total Files: ${coverageReport.totalFiles}</p>
        </div>

        <div class="summary-grid">
            ${this.generateMetricCards(coverageReport.summary, thresholdResults.globalCheck)}
        </div>

        <div class="threshold-status ${thresholdResults.passed ? 'passed' : 'failed'}">
            ${thresholdResults.passed ? '✅ All coverage thresholds met!' : '❌ Coverage thresholds not met'}
        </div>

        ${thresholdResults.failures.length > 0 ? `
        <div class="failures">
            <h3>❌ Threshold Failures</h3>
            <ul>
                ${thresholdResults.failures.map(failure => `
                <li>${failure.type === 'global' ? 'Global' : failure.file}: ${failure.metric} 
                    ${failure.actual}% (needs ${failure.threshold}%, missing ${failure.difference.toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <h3>📊 File Coverage Details</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>File</th>
                    <th>Lines</th>
                    <th>Statements</th>
                    <th>Functions</th>
                    <th>Branches</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${coverageReport.files.map(file => `
                <tr>
                    <td>
                        ${file.shortname}
                        ${file.isCritical ? '<span class="critical-badge">Critical</span>' : ''}
                    </td>
                    <td>${this.formatCoverageCell(file.lines)}</td>
                    <td>${this.formatCoverageCell(file.statements)}</td>
                    <td>${this.formatCoverageCell(file.functions)}</td>
                    <td>${this.formatCoverageCell(file.branches)}</td>
                    <td>${this.getFileStatus(file, thresholdResults)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

    const outputPath = path.join(process.cwd(), 'mobile/coverage/coverage-summary.html');
    fs.writeFileSync(outputPath, htmlTemplate);
    console.log(`📊 HTML coverage report generated: ${outputPath}`);
  }

  generateMarkdownReport(coverageReport, thresholdResults) {
    const { summary } = coverageReport;
    const markdown = `
# 🐾 TailTracker Test Coverage Report

*Generated on ${new Date(coverageReport.timestamp).toLocaleString()}*

## 📊 Coverage Summary

| Metric | Coverage | Status |
|--------|----------|--------|
| **Lines** | ${summary.lines.pct}% (${summary.lines.covered}/${summary.lines.total}) | ${this.getStatusEmoji(summary.lines.pct, this.coverageThreshold.global.lines)} |
| **Statements** | ${summary.statements.pct}% (${summary.statements.covered}/${summary.statements.total}) | ${this.getStatusEmoji(summary.statements.pct, this.coverageThreshold.global.statements)} |
| **Functions** | ${summary.functions.pct}% (${summary.functions.covered}/${summary.functions.total}) | ${this.getStatusEmoji(summary.functions.pct, this.coverageThreshold.global.functions)} |
| **Branches** | ${summary.branches.pct}% (${summary.branches.covered}/${summary.branches.total}) | ${this.getStatusEmoji(summary.branches.pct, this.coverageThreshold.global.branches)} |

## 🎯 Threshold Status

${thresholdResults.passed ? '✅ **All coverage thresholds met!**' : '❌ **Coverage thresholds not met**'}

${thresholdResults.failures.length > 0 ? `
### ❌ Failures
${thresholdResults.failures.map(failure => 
  `- **${failure.type === 'global' ? 'Global' : failure.file}**: ${failure.metric} ${failure.actual}% (needs ${failure.threshold}%, missing ${failure.difference.toFixed(1)}%)`
).join('\n')}
` : ''}

## 📁 Critical Files Coverage

${coverageReport.files.filter(f => f.isCritical).map(file => 
  `- **${file.shortname}**: Lines ${file.lines.pct}%, Functions ${file.functions.pct}%, Branches ${file.branches.pct}%`
).join('\n')}

## 📈 Coverage Trends

*Total Files Covered: ${coverageReport.totalFiles}*

---
*Report generated by TailTracker Test Automation Suite*
`;

    const outputPath = path.join(process.cwd(), 'mobile/coverage/coverage-summary.md');
    fs.writeFileSync(outputPath, markdown.trim());
    console.log(`📝 Markdown coverage report generated: ${outputPath}`);
  }

  generateBadgeData(coverageReport) {
    const { summary } = coverageReport;
    const overallCoverage = Math.round(
      (summary.lines.pct + summary.statements.pct + summary.functions.pct + summary.branches.pct) / 4
    );
    
    const getBadgeColor = (percentage) => {
      if (percentage >= 90) return 'brightgreen';
      if (percentage >= 80) return 'green';
      if (percentage >= 70) return 'yellow';
      if (percentage >= 60) return 'orange';
      return 'red';
    };

    const badgeData = {
      schemaVersion: 1,
      label: 'coverage',
      message: `${overallCoverage}%`,
      color: getBadgeColor(overallCoverage),
      namedLogo: 'jest',
    };

    const outputPath = path.join(process.cwd(), 'mobile/coverage/badge-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(badgeData, null, 2));
    
    console.log(`🏷️  Badge data generated: ${outputPath}`);
  }

  logCoverageResults(coverageReport, thresholdResults) {
    const { summary } = coverageReport;
    
    console.log('\n📊 TailTracker Coverage Results:');
    console.log('================================');
    console.log(`📁 Total Files: ${coverageReport.totalFiles}`);
    console.log(`📅 Generated: ${new Date(coverageReport.timestamp).toLocaleString()}`);
    console.log('');
    
    console.log('Coverage Metrics:');
    ['lines', 'statements', 'functions', 'branches'].forEach(type => {
      const data = summary[type];
      const threshold = this.coverageThreshold.global[type];
      const status = data.pct >= threshold ? '✅' : '❌';
      console.log(`  ${status} ${type.padEnd(11)}: ${data.pct.toString().padStart(6)}% (${data.covered}/${data.total}) [threshold: ${threshold}%]`);
    });

    console.log('');
    
    if (thresholdResults.failures.length > 0) {
      console.log('❌ Threshold Failures:');
      thresholdResults.failures.forEach(failure => {
        console.log(`  - ${failure.type === 'global' ? 'Global' : failure.file}: ${failure.metric} ${failure.actual}% (needs ${failure.threshold}%)`);
      });
      console.log('');
    }

    // Log critical files
    const criticalFiles = coverageReport.files.filter(f => f.isCritical);
    if (criticalFiles.length > 0) {
      console.log('🎯 Critical Files Coverage:');
      criticalFiles.forEach(file => {
        const status = this.isCriticalFilePassing(file) ? '✅' : '❌';
        console.log(`  ${status} ${file.shortname}: L:${file.lines.pct}% S:${file.statements.pct}% F:${file.functions.pct}% B:${file.branches.pct}%`);
      });
      console.log('');
    }

    // Log files with low coverage
    const lowCoverageFiles = coverageReport.files
      .filter(f => f.lines.pct < 80)
      .sort((a, b) => a.lines.pct - b.lines.pct)
      .slice(0, 5);

    if (lowCoverageFiles.length > 0) {
      console.log('⚠️  Files needing attention (lowest coverage):');
      lowCoverageFiles.forEach(file => {
        console.log(`  📄 ${file.shortname}: ${file.lines.pct}% lines covered`);
        if (file.uncoveredLines.length > 0) {
          console.log(`     Uncovered lines: ${file.uncoveredLines.slice(0, 10).join(', ')}${file.uncoveredLines.length > 10 ? '...' : ''}`);
        }
      });
      console.log('');
    }

    console.log(`🎯 Overall Status: ${thresholdResults.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('================================\n');
  }

  // Helper methods
  shouldIncludeFile(filename) {
    const relativePath = path.relative(process.cwd(), filename);
    return !relativePath.includes('node_modules') && 
           !relativePath.includes('__tests__') &&
           !relativePath.includes('.test.') &&
           !relativePath.includes('.spec.') &&
           !relativePath.includes('/test/') &&
           relativePath.startsWith('mobile/src/') &&
           (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx') || relativePath.endsWith('.js') || relativePath.endsWith('.jsx'));
  }

  isCriticalFile(filename) {
    return this.criticalFiles.some(pattern => filename.includes(pattern));
  }

  isCriticalFilePassing(file) {
    const threshold = this.coverageThreshold.critical;
    return file.lines.pct >= threshold.lines &&
           file.statements.pct >= threshold.statements &&
           file.functions.pct >= threshold.functions &&
           file.branches.pct >= threshold.branches;
  }

  getUncoveredLines(fileCoverage) {
    const uncoveredLines = [];
    const lineMap = fileCoverage.getLineCoverage();
    
    Object.keys(lineMap).forEach(line => {
      if (lineMap[line] === 0) {
        uncoveredLines.push(parseInt(line));
      }
    });
    
    return uncoveredLines.sort((a, b) => a - b);
  }

  getUncoveredFunctions(fileCoverage) {
    const uncoveredFunctions = [];
    const functionMap = fileCoverage.f;
    const functionNames = fileCoverage.fnMap;
    
    Object.keys(functionMap).forEach(fnIndex => {
      if (functionMap[fnIndex] === 0 && functionNames[fnIndex]) {
        uncoveredFunctions.push(functionNames[fnIndex].name || 'anonymous');
      }
    });
    
    return uncoveredFunctions;
  }

  formatCoverageCell(coverage) {
    const percentage = coverage.pct;
    const color = percentage >= 90 ? 'good' : percentage >= 70 ? 'warning' : 'danger';
    return `<span class="${color}">${percentage}%</span> (${coverage.covered}/${coverage.total})`;
  }

  generateMetricCards(summary, thresholds) {
    return ['lines', 'statements', 'functions', 'branches'].map(type => {
      const data = summary[type];
      const threshold = thresholds[type];
      const colorClass = threshold.passed ? 'good' : 'danger';
      
      return `
        <div class="metric-card">
          <div class="metric-value ${colorClass}">${data.pct}%</div>
          <div class="metric-label">${type}</div>
          <div class="progress-bar">
            <div class="progress-fill ${colorClass}" style="width: ${data.pct}%"></div>
          </div>
          <small>${data.covered}/${data.total} covered</small>
        </div>
      `;
    }).join('');
  }

  getFileStatus(file, thresholdResults) {
    const isCritical = file.isCritical;
    const threshold = isCritical ? this.coverageThreshold.critical : this.coverageThreshold.global;
    
    const passing = file.lines.pct >= threshold.lines &&
                   file.statements.pct >= threshold.statements &&
                   file.functions.pct >= threshold.functions &&
                   file.branches.pct >= threshold.branches;
    
    return passing ? '✅' : '❌';
  }

  getStatusEmoji(actual, threshold) {
    return actual >= threshold ? '✅' : '❌';
  }
}

module.exports = TailTrackerCoverageReporter;